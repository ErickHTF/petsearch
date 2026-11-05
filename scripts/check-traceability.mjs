#!/usr/bin/env node
// Traceability check (PRC-02, PRC-03, PRC-04, PRC-05). Spec: docs/plan.md section 9.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ID_PATTERN = /\b(?:FR|NFR|PRV|DLV|PRC)-\d{2}\b/g;
const ROW_ID = /^(FR|NFR|PRV|DLV|PRC)-\d{2}$/;
const SCAN_ROOTS = ['AGENTS.md', 'docs', 'apps', 'packages', 'e2e'];
const SCAN_EXTENSIONS = /\.(md|ts|tsx|js|mjs)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', 'sources']);

export function parseMatrix(markdown) {
  const rows = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (!ROW_ID.test(cells[0] ?? '')) continue;
    const [id, requirement, source, type, priority, status, verification, evidence] = cells;
    rows.push({ id, requirement, source, type, priority, status, verification, evidence });
  }
  return rows;
}

export function evidencePaths(evidence) {
  return (evidence ?? '').match(/docs\/evidence\/[^\s,;`)]+/g) ?? [];
}

function listFiles(root, path) {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) return SCAN_EXTENSIONS.test(path) ? [path] : [];
  return readdirSync(full).flatMap((name) =>
    SKIP_DIRS.has(name) ? [] : listFiles(root, join(path, name)),
  );
}

export function findReferences(root) {
  const references = new Map();
  for (const file of SCAN_ROOTS.flatMap((path) => listFiles(root, path))) {
    for (const id of readFileSync(join(root, file), 'utf8').match(ID_PATTERN) ?? []) {
      if (!references.has(id)) references.set(id, new Set());
      references.get(id).add(file);
    }
  }
  return references;
}

export function readCommits(root, base) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', base], { cwd: root, stdio: 'ignore' });
  } catch {
    return null;
  }
  const out = execFileSync('git', ['log', '--format=%h%x09%P%x09%s', `${base}..HEAD`], {
    cwd: root,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, parents, subject] = line.split('\t');
      return { hash, isMerge: parents.trim().split(' ').length > 1, subject };
    });
}

export function check({ root, matrix, commits }) {
  const errors = [];
  const warnings = [];
  const ids = matrix.map((row) => row.id);
  const known = new Set(ids);

  for (const id of new Set(ids.filter((id, index) => ids.indexOf(id) !== index))) {
    errors.push(`Duplicate ID in requirements.md: ${id}`);
  }

  for (const [id, files] of findReferences(root)) {
    if (!known.has(id)) errors.push(`Unknown ID ${id} referenced in: ${[...files].join(', ')}`);
  }

  for (const row of matrix) {
    if (row.status === 'verified') {
      const paths = evidencePaths(row.evidence);
      if (paths.length === 0) errors.push(`${row.id} is verified but has no evidence path`);
      for (const path of paths) {
        if (!existsSync(join(root, path))) {
          errors.push(`${row.id} is verified but evidence file is missing: ${path}`);
        }
      }
    }
    if (row.id.startsWith('DLV-') && ['', '-'].includes(row.evidence ?? '')) {
      warnings.push(`${row.id} has no planned evidence`);
    }
  }

  if (commits === null) {
    warnings.push('Base branch not found; commit messages were not checked');
  } else {
    for (const commit of commits) {
      if (commit.isMerge) continue;
      const found = commit.subject.match(ID_PATTERN) ?? [];
      if (found.length === 0) {
        errors.push(`Commit ${commit.hash} has no requirement ID: "${commit.subject}"`);
      }
      for (const id of found) {
        if (!known.has(id)) errors.push(`Commit ${commit.hash} references unknown ID ${id}`);
      }
    }
  }

  return { errors, warnings };
}

export function summarize(matrix) {
  const counts = {};
  for (const row of matrix) {
    const type = row.id.split('-')[0];
    counts[type] ??= {};
    counts[type][row.status] = (counts[type][row.status] ?? 0) + 1;
  }
  return counts;
}

function main() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const matrix = parseMatrix(readFileSync(join(root, 'docs/requirements.md'), 'utf8'));
  const base = process.env.TRACE_BASE ?? 'main';
  const commits = readCommits(root, base);
  const { errors, warnings } = check({ root, matrix, commits });

  console.log(`Requirements: ${matrix.length} rows in docs/requirements.md`);
  for (const [type, statuses] of Object.entries(summarize(matrix))) {
    const parts = Object.entries(statuses).map(([status, n]) => `${status} ${n}`);
    console.log(`  ${type.padEnd(4)} ${parts.join(', ')}`);
  }
  if (commits) console.log(`Commits checked against ${base}: ${commits.length}`);
  for (const warning of warnings) console.log(`WARN  ${warning}`);
  for (const error of errors) console.log(`ERROR ${error}`);
  console.log(errors.length ? `FAILED with ${errors.length} error(s)` : 'OK');
  process.exitCode = errors.length ? 1 : 0;
}

if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') main();

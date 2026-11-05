import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { check, evidencePaths, parseMatrix } from './check-traceability.mjs';

const header = '| ID | Requirement | Source | Type | Priority | Status | Verification | Evidence |';

function fixture({ rows, files = {} }) {
  const root = mkdtempSync(join(tmpdir(), 'trace-'));
  mkdirSync(join(root, 'docs/evidence'), { recursive: true });
  const markdown = [header, '|---|---|---|---|---|---|---|---|', ...rows].join('\n');
  writeFileSync(join(root, 'docs/requirements.md'), markdown);
  for (const [path, content] of Object.entries(files)) writeFileSync(join(root, path), content);
  return { root, matrix: parseMatrix(markdown) };
}

test('parses only requirement rows', () => {
  const { matrix } = fixture({
    rows: ['| FR-01 | A | S p1 | functional | Must | planned | x | - |'],
  });
  assert.equal(matrix.length, 1);
  assert.equal(matrix[0].status, 'planned');
});

test('extracts evidence paths', () => {
  assert.deepEqual(evidencePaths('`docs/evidence/a.png`, docs/evidence/b.txt'), [
    'docs/evidence/a.png',
    'docs/evidence/b.txt',
  ]);
  assert.deepEqual(evidencePaths('planned: screenshot'), []);
});

test('fails on an ID referenced but missing from the matrix', () => {
  const { root, matrix } = fixture({
    rows: ['| FR-01 | A | S | functional | Must | planned | x | - |'],
    files: { 'AGENTS.md': 'See FR-01 and FR-99.' },
  });
  const { errors } = check({ root, matrix, commits: [] });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Unknown ID FR-99/);
});

test('fails on a verified row whose evidence file does not exist', () => {
  const { root, matrix } = fixture({
    rows: ['| FR-01 | A | S | functional | Must | verified | x | docs/evidence/missing.png |'],
  });
  const { errors } = check({ root, matrix, commits: [] });
  assert.match(errors.join('\n'), /evidence file is missing: docs\/evidence\/missing.png/);
});

test('fails on a verified row without any evidence path', () => {
  const { root, matrix } = fixture({
    rows: ['| FR-01 | A | S | functional | Must | verified | x | planned: screenshot |'],
  });
  assert.match(check({ root, matrix, commits: [] }).errors.join('\n'), /no evidence path/);
});

test('passes on a verified row whose evidence file exists', () => {
  const { root, matrix } = fixture({
    rows: ['| FR-01 | A | S | functional | Must | verified | x | docs/evidence/ok.png |'],
    files: { 'docs/evidence/ok.png': 'x' },
  });
  assert.deepEqual(check({ root, matrix, commits: [] }).errors, []);
});

test('fails on commits without an ID, ignoring merges', () => {
  const { root, matrix } = fixture({
    rows: ['| FR-01 | A | S | functional | Must | planned | x | - |'],
  });
  const commits = [
    { hash: 'a1', isMerge: false, subject: 'Add list (FR-01)' },
    { hash: 'b2', isMerge: false, subject: 'Fix typo' },
    { hash: 'c3', isMerge: true, subject: 'Merge branch x' },
  ];
  const { errors } = check({ root, matrix, commits });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /b2 has no requirement ID/);
});

test('warns on DLV rows without planned evidence', () => {
  const { root, matrix } = fixture({
    rows: ['| DLV-01 | A | B 1 | deliverable | Must | planned | x | - |'],
  });
  assert.match(check({ root, matrix, commits: [] }).warnings.join('\n'), /DLV-01/);
});

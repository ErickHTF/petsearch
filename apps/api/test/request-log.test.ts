import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';

describe('request log (NFR-07)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs one line per request without query string and returns the request id', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const app = createApp({ sessionSecret: 'test-secret', cookieSecure: false, requestLog: true });
    const res = await request(app).get('/api/notices?neighborhood=centro');
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    const line = JSON.parse(String(log.mock.calls.at(-1)?.[0]));
    expect(line).toMatchObject({
      id: res.headers['x-request-id'],
      method: 'GET',
      path: '/api/notices',
      status: 200,
    });
    expect(Object.keys(line).sort()).toEqual(['at', 'id', 'method', 'ms', 'path', 'status']);
  });
});

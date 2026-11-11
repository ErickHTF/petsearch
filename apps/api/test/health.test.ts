import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeApp } from './helpers.ts';

describe('health and readiness (NFR-07)', () => {
  it('reports liveness and database readiness', async () => {
    const app = makeApp();
    expect((await request(app).get('/api/health')).body).toEqual({ status: 'ok' });
    expect((await request(app).get('/api/ready')).body).toEqual({ status: 'ok' });
  });
});

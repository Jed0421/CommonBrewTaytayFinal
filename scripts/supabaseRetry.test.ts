import assert from 'node:assert/strict';
import { createClockSkewRetryFetch } from '../src/lib/supabaseRetry.ts';
const skew = () => Response.json({ code: 'PGRST303', message: 'JWT issued at future' }, { status: 401 });
const url = 'https://example.test/rest/v1/rpc/claim_critical_stock_email';
let calls = 0;
const waits: number[] = [];
const bodies: string[] = [];
const retry = createClockSkewRetryFetch(async input => {
  calls++;
  bodies.push(await (input as Request).text());
  return calls < 3 ? skew() : Response.json({ ok: true });
}, async ms => { waits.push(ms); });
assert.equal((await retry(url, { method: 'POST', body: '{"id":1}' })).status, 200);
assert.deepEqual(waits, [1000, 2000]);
assert.deepEqual(bodies, Array(3).fill('{"id":1}'));
calls = 0;
const exhausted = createClockSkewRetryFetch(async () => { calls++; return skew(); }, async () => {});
assert.equal((await exhausted(url)).status, 401);
assert.equal(calls, 4);
for (const response of [Response.json({code:'PGRST303',message:'JWT expired'}, {status:401}), new Response('failure',{status:500}), new Response('bad json',{status:401})]) {
  calls = 0;
  const noRetry = createClockSkewRetryFetch(async () => { calls++; return response; }, async () => { assert.fail('Unexpected retry'); });
  assert.equal(await noRetry(url), response);
  assert.equal(calls, 1);
}
calls = 0;
await exhausted('https://example.test/auth/v1/token');
assert.equal(calls, 1);
const network = createClockSkewRetryFetch(async () => { throw Error('network failure'); }, async () => assert.fail());
await assert.rejects(network(url), /network failure/);
const controller = new AbortController();
controller.abort();
await assert.rejects(retry(url, { signal: controller.signal }));
console.log('PASS: JWT retry recovery, preserved POST body, retry cap, unrelated errors, non-REST requests and aborts.');

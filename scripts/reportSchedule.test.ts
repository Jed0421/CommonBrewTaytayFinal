import assert from 'node:assert/strict';
import { reportSchedule } from './reportSchedule.ts';
const early = reportSchedule(new Date('2026-11-18T12:55:00Z'), true);
assert.equal(early.date, '2026-11-18');
assert.equal(early.closing.toISOString(), '2026-11-18T13:00:00.000Z');
assert.equal(early.waitMs, 300000);
assert.equal(reportSchedule(new Date('2026-11-18T13:00:00Z'), true).waitMs, 0);
assert.equal(reportSchedule(new Date('2026-11-18T13:03:00Z'), true).waitMs, 0);
assert.throws(() => reportSchedule(new Date('2026-11-18T00:00:00Z'), true));
assert.throws(() => reportSchedule(new Date('2026-11-18T16:00:00Z'), true));
assert.equal(reportSchedule(new Date('2026-12-31T12:55:00Z'), true).date, '2026-12-31');
console.log('Philippine closing-time boundary checks passed.');

assert.equal(reportSchedule(new Date('2026-11-18T11:17:00Z'), true).waitMs, 103 * 60 * 1000);
assert.equal(reportSchedule(new Date('2026-11-18T12:17:00Z'), true).waitMs, 43 * 60 * 1000);
assert.throws(() => reportSchedule(new Date('2026-11-18T10:59:00Z'), true));
console.log('Free early-start and backup schedule checks passed.');

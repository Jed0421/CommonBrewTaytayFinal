// Explicit UTC+08:00 boundaries; independent of the host's timezone.
export function reportSchedule(now: Date, waitForClosing: boolean) {
  const today = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const closing = new Date(today + 'T21:00:00+08:00');
  if (waitForClosing && closing.getTime() - now.getTime() > 120 * 60 * 1000) {
    throw new Error('Scheduled mode must start at or after 7:00 PM Philippine time. Use --dry-run for daytime previews.');
  }
  return { date: today, closing, waitMs: Math.max(0, closing.getTime() - now.getTime()) };
}

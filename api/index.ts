import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApplication } from '../server.ts';
import { withDatabaseTasks } from '../src/lib/databaseTasks.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return withDatabaseTasks(async () => {
    try {
      const app = await createApplication(true);
      await new Promise<void>((resolve, reject) => {
        res.once('finish', resolve);
        res.once('close', resolve);
        res.once('error', reject);
        app(req, res);
      });
    } catch (error) {
      console.error('[Vercel API initialization]', error);
      if (!res.headersSent) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ success: false, message: 'Database unavailable. Check Supabase server variables and Vercel runtime logs.' }));
      }
    }
  });
}

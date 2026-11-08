import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HydrationScope } from '../src/db/supabaseSync.ts';
import { createApplication } from '../server.ts';
import { withDatabaseTasks } from '../src/lib/databaseTasks.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return withDatabaseTasks(async () => {
    try {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      let scope: HydrationScope = 'full';
      if (req.method === 'GET') {
        if (pathname === '/api/products') scope = 'menu';
        if (pathname === '/api/categories') scope = 'categories';
        if (pathname === '/api/store-info') scope = 'store';
        if (pathname === '/api/auth/me' || pathname === '/api/customer/me') scope = 'accounts';
      }
      if (req.method === 'POST' && [
        '/api/auth/unified-login', '/api/auth/login', '/api/auth/login-customer'
      ].includes(pathname)) scope = 'accounts';
      const app = await createApplication(true, scope);
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

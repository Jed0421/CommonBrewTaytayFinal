import 'dotenv/config';
import { sendExpirationAlerts } from '../src/lib/expirationEmail.ts';
sendExpirationAlerts().catch(error => { console.error('Expiration alert check failed:', error); process.exitCode = 1; });

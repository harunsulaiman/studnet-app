import { APP_ORIGIN } from './env';

export function corsOrigins(): string[] {
  const configured = APP_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set(['http://localhost:3000', ...configured])];
}

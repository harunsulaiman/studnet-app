export const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';

export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? APP_ORIGIN;

export const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000/api/v1';

export const REDIS_URL = (() => { const value = process.env.REDIS_URL?.trim(); return value && value !== '""' ? value : undefined; })();
export const SOCKET_REDIS_ADAPTER = process.env.SOCKET_REDIS_ADAPTER !== 'false';

export const SENTRY_DSN = process.env.SENTRY_DSN?.trim() || undefined;

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;

export const SESSION_COOKIE_SECURE = IS_PRODUCTION || process.env.SESSION_COOKIE_SECURE === 'true';
export const CROSS_SITE_COOKIES =
  process.env.CROSS_SITE_COOKIES === 'true' || (IS_PRODUCTION && process.env.CROSS_SITE_COOKIES !== 'false');
export const SESSION_COOKIE_SAME_SITE = CROSS_SITE_COOKIES ? 'none' : 'lax';

export const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ??
  (IS_PRODUCTION
    ? (() => {
        throw new Error('JWT_ACCESS_SECRET must be configured in production');
      })()
    : 'development-access-secret-change-me');

export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  (IS_PRODUCTION
    ? (() => {
        throw new Error('JWT_REFRESH_SECRET must be configured in production');
      })()
    : 'development-refresh-secret-change-me');

export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || undefined;
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.trim() || undefined;
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.trim() || undefined;
export const R2_BUCKET = process.env.R2_BUCKET?.trim() || undefined;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, '') || '';

export const APP_ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:3000';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export const SESSION_COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined;

export const SESSION_COOKIE_SECURE = IS_PRODUCTION || process.env.SESSION_COOKIE_SECURE === 'true';

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

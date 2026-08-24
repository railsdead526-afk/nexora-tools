const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';

export const APP_URL = configuredUrl.replace(/\/$/, '');

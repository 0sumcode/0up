import type { Config } from '@netlify/functions';

export default async () => {
  const secret = process.env.CRON_SECRET;
  const base = process.env.URL;

  if (!secret) {
    console.error('CRON_SECRET not set');
    return new Response('CRON_SECRET not set', { status: 500 });
  }
  if (!base) {
    console.error('URL not set');
    return new Response('URL not set', { status: 500 });
  }

  const res = await fetch(`${base}/api/cron/cleanup`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await res.text();
  if (!res.ok) {
    console.error('cleanup failed', res.status, body);
    return new Response(`cleanup failed: ${res.status} ${body}`, { status: 500 });
  }

  console.log('cleanup ok', body);
  return new Response('ok');
};

export const config: Config = {
  schedule: '@hourly',
};

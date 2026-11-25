import { Queue, Worker } from 'bullmq';
import IORedis, { type RedisOptions } from 'ioredis';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error('REDIS_URL is required');

const options: RedisOptions = { maxRetriesPerRequest: null, enableReadyCheck: true };
const connection = new IORedis(redisUrl, options);
const queue = new Queue('studnet-jobs', { connection });

async function processJob(job: { name: string; data: Record<string, unknown> }) {
  Sentry.addBreadcrumb({ category: 'job', message: job.name });
  switch (job.name) {
    case 'notification':
    case 'email':
    case 'index':
      return { processed: true, name: job.name };
    default:
      throw new Error(`Unknown job: ${job.name}`);
  }
}

const worker = new Worker('studnet-jobs', processJob, { connection, concurrency: 5 });
worker.on('completed', (job) => console.log(JSON.stringify({ event: 'job.completed', id: job.id, name: job.name })));
worker.on('failed', (job, error) => {
  console.error(JSON.stringify({ event: 'job.failed', id: job?.id, name: job?.name, error: error.message }));
  Sentry.captureException(error);
});

async function shutdown() {
  await worker.close();
  await queue.close();
  await connection.quit();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(JSON.stringify({ event: 'worker.ready', queue: 'studnet-jobs' }));
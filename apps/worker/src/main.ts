import IORedis from 'ioredis';
import { Worker } from 'bullmq';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  'studnet-jobs',
  async (job) => {
    console.log(`Processing ${job.name}`, job.data);
    return { ok: true };
  },
  { connection },
);

worker.on('completed', (job) => console.log(`Completed ${job.id}`));
worker.on('failed', (job, error) => console.error(`Failed ${job?.id}`, error));

console.log('studNet worker started');

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seeding is disabled in production');
  }
  if (process.env.ALLOW_DEV_SEED !== 'true') {
    throw new Error('Set ALLOW_DEV_SEED=true to seed local development data');
  }
  console.log('Seed gate passed. No demo accounts are created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

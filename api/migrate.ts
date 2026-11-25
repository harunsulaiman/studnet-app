import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export const maxDuration = 300;

export async function GET() {
  try {
    const { stdout, stderr } = await run(
      'npx',
      ['prisma', 'migrate', 'deploy', '--schema', 'apps/api/prisma/schema.prisma'],
      { cwd: process.cwd(), env: process.env, timeout: 270000 }
    );
    return Response.json({ ok: true, stdout, stderr });
  } catch (error: any) {
    return Response.json(
      { ok: false, message: error.message, stdout: error.stdout, stderr: error.stderr },
      { status: 500 }
    );
  }
}

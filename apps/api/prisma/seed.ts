import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await argon2.hash('StudnetDemo123!', {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 3,
    parallelism: 1,
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@studnet.app' },
    update: {},
    create: {
      email: 'demo@studnet.app',
      displayName: 'Ada Demos',
        name: 'Ada Demos', handle: 'ada.demos',
      passwordHash,
      profile: { create: { verification: 'INSTITUTION_VERIFIED', bio: 'Computer science student, building in public.' } },
      roles: { create: { role: 'STUDENT' } },
    },
  });

  const harunPasswordHash = await argon2.hash('harun881', {
 type: argon2.argon2id,
 memoryCost: 19_456,
 timeCost: 3,
 parallelism: 1,
 });

 const harun = await prisma.user.upsert({
 where: { email: 'harun881@yahoo.com' },
 update: {},
 create: {
 email: 'harun881@yahoo.com',
 displayName: 'Harun',
 name: 'Harun',
 handle: 'harun881',
 passwordHash: harunPasswordHash,
 profile: { create: { verification: 'EMAIL_VERIFIED', bio: 'StudNet member.' } },
 roles: { create: { role: 'STUDENT' } },
 },
 });

 const handles = [
    ['Tobi Zaynab', 'tobihcreates'],
    ['Ada Okafor', 'ada.builds'],
    ['Chinedu Bala', 'chinedu.ng'],
    ['Ngozi Eze', 'ngozireads'],
  ] as const;
  const authors: { id: string }[] = [];
  for (const [displayName, handle] of handles) {
    authors.push(await prisma.user.upsert({
      where: { email: `${handle}@example.studnet.app` },
      update: { displayName },
      create: {
 email: `${handle}@example.studnet.app`,
 displayName,
 passwordHash,
 name: displayName,
 handle,
 profile: { create: { verification: 'CAMPUS_REP_VERIFIED', bio: `@${handle}` } },
        roles: { create: { role: 'STUDENT' } },
      },
    }));
  }

  if ((await prisma.post.count()) === 0) {
    await prisma.post.createMany({
      data: [
        {
          authorId: authors[0].id,
          type: 'PROJECT',
          typeLabel: 'Video',
          body: 'Made a 30-second breakdown of how I turned one lecture slide into a study thread that got 900 saves. The carousel is wild.',
          mediaKind: 'video',
          mediaLabel: '0:32 · Study thread breakdown',
          hashtags: ['FinalYearProject', 'BuildInPublic'],
          createdAt: new Date(Date.now() - 14 * 60_000),
        },
        {
          authorId: authors[1].id,
          type: 'ACADEMIC',
          typeLabel: 'Resource',
          body: 'Dropped my CSC 301 indexing cheat sheet. It covers B-trees, hash indexes and when NOT to use each one.',
          hashtags: ['CSC301', 'StudyNotes'],
          createdAt: new Date(Date.now() - 2 * 3_600_000),
        },
        {
          authorId: authors[2].id,
          type: 'FORUM',
          typeLabel: 'Forum',
          body: 'How are you approaching the final-year project proposal? Sharing my rubric breakdown so nobody has to guess.',
          hashtags: ['FinalYearProject', 'Question'],
          createdAt: new Date(Date.now() - 5 * 3_600_000),
        },
        {
          authorId: authors[3].id,
          type: 'CAMPUS',
          typeLabel: 'Campus',
          body: 'Library has extended hours during project week. Level 4 is quiet after 6pm if anyone needs a focus spot.',
          hashtags: ['CampusUpdate'],
          campusScoped: true,
          createdAt: new Date(Date.now() - 8 * 3_600_000),
        },
      ],
    });
  }


  if ((await prisma.opportunity.count()) === 0) {
    await prisma.opportunity.createMany({
      data: [
        { title: 'Product Design Intern', organization: 'Flutterwave', type: 'INTERNSHIP', location: 'Remote · Nigeria', mode: 'Remote', deadline: new Date(Date.now() + 12 * 86_400_000), tags: ['Design', 'Paid', '3 months'], matchScore: 96, summary: 'Work with the design systems team on student-facing experiences.' },
        { title: 'National Merit Scholarship', organization: 'NNPC Foundation', type: 'SCHOLARSHIP', location: 'Nationwide', mode: 'Hybrid', deadline: new Date(Date.now() + 25 * 86_400_000), tags: ['Scholarship', 'Undergrad'], matchScore: 91, summary: 'Full tuition support for final-year students with demonstrated leadership.' },
        { title: 'Research Assistant · AI Systems', organization: 'UNILAG', type: 'RESEARCH', location: 'Lagos', mode: 'On-site', deadline: new Date(Date.now() + 9 * 86_400_000), tags: ['Research', 'AI', 'Stipend'], matchScore: 88, summary: 'Assist on applied NLP research with publication opportunities.' },
        { title: 'Graduate Product Track', organization: 'Paystack', type: 'JOB', location: 'Lagos / Remote', mode: 'Hybrid', deadline: new Date(Date.now() + 40 * 86_400_000), tags: ['Graduate', 'Product', 'Full-time'], matchScore: 84, summary: 'Structured graduate programme for exceptional builder minds.' },
      ],
    });
  }

  const conversation = await prisma.conversation.upsert({
    where: { id: 'seed-project-group' },
    update: {},
    create: { id: 'seed-project-group', name: 'Final year project group', isGroup: true, pinned: true },
  });
  for (const user of [demo, harun, ...authors]) {
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId: user.id } },
      update: {},
      create: { conversationId: conversation.id, userId: user.id },
    });
  }
  if ((await prisma.message.count({ where: { conversationId: conversation.id } })) === 0) {
    await prisma.message.createMany({
      data: [
        { conversationId: conversation.id, senderId: authors[1].id, body: 'I shared the Week 6 checklist in the group files. Please review before Thursday.' },
        { conversationId: conversation.id, senderId: authors[0].id, body: 'Got it. I will cross-check the rubric and send my notes tonight.' },
        { conversationId: conversation.id, senderId: demo.id, body: 'Perfect, I will turn mine in tomorrow morning.' },
      ],
    });
  }

  if ((await prisma.notification.count({ where: { userId: demo.id } })) === 0) {
    await prisma.notification.createMany({
      data: [
        { userId: demo.id, kind: 'verification', title: 'You are verified', body: 'Your institution email has been confirmed.' },
        { userId: demo.id, kind: 'academic', title: 'New course resource', body: 'CSC 301 study guide was added by Ada.' },
        { userId: demo.id, kind: 'opportunity', title: 'New match for you', body: 'Product Design Intern is 96% match.' },
      ],
    });
  }

  console.log(`Seeded demo user ${demo.email} with password StudnetDemo123!`);
console.log(`Seeded user ${harun.email} with password harun881`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

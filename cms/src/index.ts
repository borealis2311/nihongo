import type { Core } from '@strapi/strapi';
import { SEED_CHAPTERS } from './data/seed';

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function setPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  const actions = [
    'api::chapter.chapter.find',
    'api::chapter.chapter.findOne',
    'api::lesson.lesson.find',
    'api::lesson.lesson.findOne',
    'api::word.word.find',
    'api::word.word.findOne',
  ];

  for (const action of actions) {
    const existing = await strapi.query('plugin::users-permissions.permission').findOne({
      where: { action, role: publicRole.id },
    });

    if (!existing) {
      await strapi.query('plugin::users-permissions.permission').create({
        data: { action, role: publicRole.id },
      });
    }
  }
}

async function seedData(strapi: Core.Strapi) {
  const alreadySeeded = await strapi
    .documents('api::chapter.chapter')
    .findFirst({ filters: { slug: 'con-nguoi' } });
  if (alreadySeeded) return;

  await strapi.db.query('api::word.word').deleteMany({});
  await strapi.db.query('api::lesson.lesson').deleteMany({});
  await strapi.db.query('api::chapter.chapter').deleteMany({});

  for (let ci = 0; ci < SEED_CHAPTERS.length; ci += 1) {
    const chapterData = SEED_CHAPTERS[ci];

    const chapter = await strapi.documents('api::chapter.chapter').create({
      data: { name: chapterData.name, slug: slugify(chapterData.name), order: ci },
      status: 'published',
    });

    for (let li = 0; li < chapterData.lessons.length; li += 1) {
      const lessonData = chapterData.lessons[li];

      await strapi.documents('api::lesson.lesson').create({
        data: {
          name: lessonData.name,
          slug: slugify(lessonData.name),
          order: li,
          chapter: chapter.documentId,
        },
        status: 'published',
      });
    }
  }

  strapi.log.info('Seed data: chapters and lessons created from textbook table of contents.');
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);
    await seedData(strapi);
  },
};

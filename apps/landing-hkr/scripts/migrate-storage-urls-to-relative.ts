import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const writeMode = process.argv.includes('--write');

const allowedOrigins = new Set([
  'hkr-landing.berinovasi.top',
  'hkr-landing.southneuhof.tech',
  'localhost:5173',
].map((item) => item.toLowerCase()));

type SummaryEntry = {
  scanned: number;
  changed: number;
};

const summary: Record<string, SummaryEntry> = {};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toRelativeStoragePath(value: string): string {
  try {
    const parsed = new URL(value);
    if (!allowedOrigins.has(parsed.host.toLowerCase())) return value;
    if (!parsed.pathname.startsWith('/storage/')) return value;
    return parsed.pathname;
  } catch {
    return value;
  }
}

function transformUnknown(value: unknown): [unknown, boolean] {
  if (typeof value === 'string') {
    const next = toRelativeStoragePath(value);
    return [next, next !== value];
  }

  if (Array.isArray(value)) {
    let changed = false;
    const output = value.map((item) => {
      const [next, childChanged] = transformUnknown(item);
      if (childChanged) changed = true;
      return next;
    });
    return [changed ? output : value, changed];
  }

  if (isObject(value)) {
    let changed = false;
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const [next, childChanged] = transformUnknown(child);
      output[key] = next;
      if (childChanged) changed = true;
    }
    return [changed ? output : value, changed];
  }

  return [value, false];
}

async function migrateModel(params: {
  label: string;
  delegate: any;
  idField: string;
  fields: string[];
}) {
  summary[params.label] = { scanned: 0, changed: 0 };

  const rows = await params.delegate.findMany({
    select: Object.fromEntries([params.idField, ...params.fields].map((field) => [field, true])),
  });

  for (const row of rows) {
    summary[params.label].scanned += 1;
    const updateData: Record<string, unknown> = {};

    for (const field of params.fields) {
      const [next, changed] = transformUnknown(row[field]);
      if (changed) {
        updateData[field] = next;
      }
    }

    if (Object.keys(updateData).length === 0) continue;

    summary[params.label].changed += 1;
    if (writeMode) {
      await params.delegate.update({
        where: { [params.idField]: row[params.idField] },
        data: updateData,
      });
    }
  }
}

async function run() {
  await migrateModel({
    label: 'Content',
    delegate: (prisma as any).content,
    idField: 'id',
    fields: ['media', 'attachment', 'collection', 'meta'],
  });

  await migrateModel({
    label: 'ArticleTranslation',
    delegate: (prisma as any).articleTranslation,
    idField: 'id',
    fields: ['thumbnail'],
  });

  await migrateModel({
    label: 'MenuItemTranslation',
    delegate: (prisma as any).menuItemTranslation,
    idField: 'id',
    fields: ['media'],
  });

  await migrateModel({
    label: 'CompanyProfile',
    delegate: (prisma as any).companyProfile,
    idField: 'id',
    fields: ['logo', 'subsidiaries'],
  });

  await migrateModel({
    label: 'Section',
    delegate: (prisma as any).section,
    idField: 'id',
    fields: ['meta'],
  });

  await migrateModel({
    label: 'FormSubmission',
    delegate: (prisma as any).formSubmission,
    idField: 'id',
    fields: ['data'],
  });

  if ((prisma as any).imageManifest) {
    await migrateModel({
      label: 'ImageManifest',
      delegate: (prisma as any).imageManifest,
      idField: 'id',
      fields: ['original_path', 'variants'],
    });
  }

  const totals = Object.values(summary).reduce((acc, item) => {
    acc.scanned += item.scanned;
    acc.changed += item.changed;
    return acc;
  }, { scanned: 0, changed: 0 });

  console.log(`Mode: ${writeMode ? 'WRITE' : 'DRY RUN'}`);
  for (const [label, item] of Object.entries(summary)) {
    console.log(`${label}: scanned=${item.scanned} changed=${item.changed}`);
  }
  console.log(`Total: scanned=${totals.scanned} changed=${totals.changed}`);
}

run()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

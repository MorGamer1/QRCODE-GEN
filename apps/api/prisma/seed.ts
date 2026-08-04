import {
  PrismaClient,
  ContentType as PrismaContentType,
  QrCodeType as PrismaQrCodeType,
} from '@prisma/client';
import * as argon2 from 'argon2';
import {
  ContentType,
  encodeStaticContent,
  generateShortCode,
  qrDesignSchema,
  QR_DESIGN_PRESETS,
} from '@qrgen/shared';

const prisma = new PrismaClient();

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';

async function main() {
  console.log('Seeding database...');

  await prisma.systemSetting.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });

  const adminPassword = await argon2.hash('ChangeMe123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Platform Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const demoPassword = await argon2.hash('DemoPass123!');
  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash: demoPassword,
      role: 'USER',
      emailVerified: true,
    },
  });

  const marketing = await prisma.category.upsert({
    where: { userId_name: { userId: demo.id, name: 'Marketing' } },
    update: {},
    create: { userId: demo.id, name: 'Marketing', color: '#2563EB' },
  });
  await prisma.category.upsert({
    where: { userId_name: { userId: demo.id, name: 'Events' } },
    update: {},
    create: { userId: demo.id, name: 'Events', color: '#F59E0B' },
  });

  const classicDesign = qrDesignSchema.parse(QR_DESIGN_PRESETS[0]!.design);
  const gradientDesign = qrDesignSchema.parse(QR_DESIGN_PRESETS[3]!.design);

  // Static QR - encoded directly, immutable.
  const staticUrlContent = { url: 'https://example.com/product/launch' };
  await prisma.qrCode.create({
    data: {
      userId: demo.id,
      type: PrismaQrCodeType.STATIC,
      contentType: PrismaContentType.URL,
      content: staticUrlContent,
      encodedPayload: encodeStaticContent(ContentType.URL, staticUrlContent),
      design: classicDesign,
      name: 'Product Launch (static)',
      tags: ['product', 'launch'],
      categoryId: marketing.id,
    },
  });

  // Dynamic QR with simulated scan history for demo analytics.
  const dynamicShortCode = generateShortCode();
  const dynamicQr = await prisma.qrCode.create({
    data: {
      userId: demo.id,
      type: PrismaQrCodeType.DYNAMIC,
      contentType: PrismaContentType.URL,
      shortCode: dynamicShortCode,
      content: { url: 'https://example.com/summer-sale' },
      encodedPayload: `${PUBLIC_BASE_URL}/r/${dynamicShortCode}`,
      design: gradientDesign,
      name: 'Summer Sale Campaign',
      tags: ['sale', 'campaign'],
      categoryId: marketing.id,
      isFavorite: true,
    },
  });

  const countries = ['US', 'GB', 'DE', 'FR', 'BR', 'IN', 'CA'];
  const devices = ['MOBILE', 'MOBILE', 'MOBILE', 'DESKTOP', 'TABLET'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const now = Date.now();
  const scanRows = Array.from({ length: 180 }).map((_, i) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const scannedAt = new Date(
      now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 86400000),
    );
    return {
      qrCodeId: dynamicQr.id,
      scannedAt,
      isUnique: i % 3 === 0,
      country: countries[Math.floor(Math.random() * countries.length)],
      deviceType: devices[Math.floor(Math.random() * devices.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      os: 'iOS',
      language: 'en-US',
      utmSource: i % 4 === 0 ? 'newsletter' : null,
      utmMedium: i % 4 === 0 ? 'email' : null,
      utmCampaign: i % 4 === 0 ? 'summer-sale' : null,
    };
  });
  await prisma.scan.createMany({ data: scanRows });

  const dailyBuckets = new Map<string, { total: number; unique: number }>();
  for (const row of scanRows) {
    const key = row.scannedAt.toISOString().slice(0, 10);
    const bucket = dailyBuckets.get(key) ?? { total: 0, unique: 0 };
    bucket.total += 1;
    if (row.isUnique) bucket.unique += 1;
    dailyBuckets.set(key, bucket);
  }
  await prisma.$transaction(
    Array.from(dailyBuckets.entries()).map(([date, stat]) =>
      prisma.scanDailyStat.upsert({
        where: { qrCodeId_date: { qrCodeId: dynamicQr.id, date: new Date(date) } },
        update: { totalScans: stat.total, uniqueScans: stat.unique },
        create: {
          qrCodeId: dynamicQr.id,
          date: new Date(date),
          totalScans: stat.total,
          uniqueScans: stat.unique,
        },
      }),
    ),
  );

  await prisma.qrCode.update({
    where: { id: dynamicQr.id },
    data: {
      totalScans: scanRows.length,
      uniqueScans: scanRows.filter((s) => s.isUnique).length,
      firstScannedAt: scanRows.reduce(
        (min, s) => (s.scannedAt < min ? s.scannedAt : min),
        scanRows[0]!.scannedAt,
      ),
      lastScannedAt: scanRows.reduce(
        (max, s) => (s.scannedAt > max ? s.scannedAt : max),
        scanRows[0]!.scannedAt,
      ),
    },
  });

  // Dynamic Wi-Fi QR with access controls set, to exercise password/expiry/scan-limit fields.
  const wifiShortCode = generateShortCode();
  await prisma.qrCode.create({
    data: {
      userId: demo.id,
      type: PrismaQrCodeType.DYNAMIC,
      contentType: PrismaContentType.WIFI,
      shortCode: wifiShortCode,
      content: { ssid: 'Office-Guest', password: 'welcome123', encryption: 'WPA', hidden: false },
      encodedPayload: `${PUBLIC_BASE_URL}/r/${wifiShortCode}`,
      design: classicDesign,
      name: 'Office Guest Wi-Fi',
      tags: ['office'],
      scanLimit: 500,
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin login: admin@example.com / ChangeMe123!`);
  console.log(`  Demo login:  demo@example.com / DemoPass123!`);
  console.log(`  (admin id=${admin.id}, demo id=${demo.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

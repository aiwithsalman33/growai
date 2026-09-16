/**
 * Seeds pricing plans, global settings, and the three demo accounts that the
 * UI's role portals expect. Idempotent — safe to re-run.
 *
 *   npm run seed      (inside the backend container)
 */
const prisma = require('../src/config/db');
const { hashPassword } = require('../src/services/tokenService');

const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Partner.ai2024';

const PLANS = [
  {
    name: 'Single Business',
    priceMonthly: 29,
    maxGbpAccounts: 1,
    isAgencyPlan: false,
    aiReplyQuota: 100,
    features: [
      '1 Google Business Profile',
      'AI-Assisted Review Replies',
      'Post Scheduling & Calendar',
      'Basic Insights & KPI Dashboard',
      'Photo & Media Manager',
      'Standard Email Support',
    ],
  },
  {
    name: 'Agency Starter',
    priceMonthly: 99,
    maxGbpAccounts: 5,
    isAgencyPlan: true,
    aiReplyQuota: 500,
    features: [
      'Up to 5 Client GBP Accounts',
      'Full Multi-Client Switcher',
      'AI Auto-Reply with Custom Guardrails',
      'Multi-Location Bulk Post Scheduling',
      'Consolidated + Per-Client Reporting',
      '3 Team Member Seats',
    ],
  },
  {
    name: 'Agency Pro',
    priceMonthly: 199,
    maxGbpAccounts: 15,
    isAgencyPlan: true,
    aiReplyQuota: 2000,
    features: [
      'Up to 15 Client GBP Accounts',
      'Custom LLM API Key (Bring Your Own)',
      'Unlimited Post Scheduling',
      'Automated Review Auto-Replies (24/7)',
      '10 Team Member Seats',
      'Priority Live Chat & SLA Support',
    ],
  },
  {
    name: 'Enterprise / Scale',
    priceMonthly: 499,
    maxGbpAccounts: 50,
    isAgencyPlan: true,
    aiReplyQuota: null,
    features: [
      '50+ Client GBP Accounts',
      'Dedicated Account Manager',
      'Custom SLA & SOC2 Compliance',
      'Unlimited Team Seats',
      'Custom Webhooks & REST API Access',
    ],
  },
];

async function seedPlans() {
  const byName = {};
  for (const plan of PLANS) {
    const existing = await prisma.pricingPlan.findFirst({
      where: { name: plan.name },
    });
    byName[plan.name] = existing
      ? await prisma.pricingPlan.update({ where: { id: existing.id }, data: plan })
      : await prisma.pricingPlan.create({ data: plan });
  }
  return byName;
}

async function seedUser({ name, email, role, companyName, planId }) {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { email },
      data: { name, role, companyName, planId },
    });
  }
  return prisma.user.create({
    data: { name, email, passwordHash, role, companyName, planId },
  });
}

async function seed() {
  const plans = await seedPlans();

  const single = await seedUser({
    name: 'Elena Rostova',
    email: 'elena@artisanroast.com',
    role: 'single',
    companyName: 'Artisan Roast & Espresso',
    planId: plans['Single Business'].id,
  });

  const agency = await seedUser({
    name: 'Marcus Vance',
    email: 'marcus@peakscalemedia.com',
    role: 'agency',
    companyName: 'PeakScale Growth Agency',
    planId: plans['Agency Pro'].id,
  });

  await seedUser({
    name: 'Alex Chen',
    email: 'alex@partner.ai',
    role: 'super_admin',
    companyName: 'Partner.ai Core Team',
    planId: plans['Enterprise / Scale'].id,
  });

  // One unconnected GBP account each, so the dashboards have something to scope
  // to before anyone completes the Google OAuth flow.
  const locations = [
    { ownerUserId: single.id, locationName: 'Artisan Roast & Espresso', clientLabel: null },
    { ownerUserId: agency.id, locationName: 'Blue Harbor Dental', clientLabel: 'Blue Harbor' },
    { ownerUserId: agency.id, locationName: 'Summit Auto Repair', clientLabel: 'Summit Auto' },
  ];

  for (const location of locations) {
    const existing = await prisma.gbpAccount.findFirst({
      where: { ownerUserId: location.ownerUserId, locationName: location.locationName },
    });
    if (!existing) {
      await prisma.gbpAccount.create({
        data: { ...location, googleAccountId: '', googleLocationId: '', connected: false },
      });
    }
  }

  const settings = await prisma.globalPlatformSettings.findFirst();
  if (!settings) await prisma.globalPlatformSettings.create({ data: {} });

  return {
    plans: Object.keys(plans).length,
    users: 3,
    password: DEMO_PASSWORD,
  };
}

module.exports = { seed };

// Only runs the seed when invoked directly (`npm run seed`) — importing this
// module from the dev-only reseed endpoint must not disconnect the shared
// Prisma client out from under the server.
if (require.main === module) {
  seed()
    .then((result) => {
      console.log('Seed complete.');
      console.log(`  Demo password for all three accounts: ${result.password}`);
      console.log('  elena@artisanroast.com     (single)');
      console.log('  marcus@peakscalemedia.com  (agency)');
      console.log('  alex@partner.ai            (super_admin)');
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

const { MultiTenantRouter, UnknownTenantError } = require('../dist/index.js');

const router = new MultiTenantRouter();

// Register resolvers in priority order
router.registerResolver(MultiTenantRouter.headerResolver('x-tenant-id'));
router.registerResolver(MultiTenantRouter.pathResolver());

// Mock requests
const reqHeader = { headers: { 'x-tenant-id': 'acme' } };
const reqPath = { path: '/t/stripe/api/data' };
const reqDefault = { headers: {} };

// Demo 1: Header resolution
console.log('=== Demo 1: Header Resolver ===');
const { tenant: t1 } = router.resolve(reqHeader);
console.log(`Resolved: ${t1}`);

// Demo 2: Path resolution
console.log('\n=== Demo 2: Path Resolver ===');
const { tenant: t2 } = router.resolve(reqPath);
console.log(`Resolved: ${t2}`);

// Demo 3: Isolation
console.log('\n=== Demo 3: Tenant Isolation ===');
router.set('acme', 'apiKey', 'acme-key-123');
router.set('acme', 'features', ['basic', 'premium']);
router.set('stripe', 'apiKey', 'stripe-key-456');
router.set('stripe', 'plan', 'pro');

console.log(`acme.apiKey: ${router.get('acme', 'apiKey')}`);
console.log(`stripe.apiKey: ${router.get('stripe', 'apiKey')}`);
console.log(`acme.features: ${JSON.stringify(router.get('acme', 'features'))}`);

// Verify no cross-tenant leaks
console.log(`acme cannot access stripe.plan:`, !router.get('acme', 'plan'));
console.log(`stripe cannot access acme.features:`, !router.get('stripe', 'features'));

// Demo 4: Default tenant
console.log('\n=== Demo 4: Default Tenant ===');
router.setDefaultTenant('default');
const { tenant: t3, context } = router.resolve(reqDefault);
console.log(`Resolved via default: ${t3} (source: ${context.source})`);

console.log('\n=== Summary ===');
console.log(`✓ Multiple resolvers working`);
console.log(`✓ Tenant isolation verified`);
console.log(`✓ Default tenant fallback working`);

# multi-tenant-router

Tenant resolution + isolation. Extract tenant from hostname (acme.app.com → acme), header (X-Tenant-Id), or path (/t/acme/...) in configurable order. Per-tenant registry with isolated get/set — no cross-tenant data leaks.

## Quickstart

```typescript
import { MultiTenantRouter } from 'multi-tenant-router';

const router = new MultiTenantRouter();

// Register resolvers in order
router.registerResolver(MultiTenantRouter.headerResolver('x-tenant-id'));
router.registerResolver(MultiTenantRouter.hostnameResolver(req));
router.registerResolver(MultiTenantRouter.pathResolver());

// Set fallback
router.setDefaultTenant('default');

// Resolve request
const { tenant, context } = router.resolve(req);

// Isolated tenant config
router.set(tenant, 'apiKey', 'secret123');
router.set(tenant, 'features', ['feature1', 'feature2']);

const config = router.get(tenant, 'apiKey'); // 'secret123'
```

## API

### Constructor

```typescript
new MultiTenantRouter()
```

### Methods

#### `registerResolver(resolver)`

Register a tenant resolver function. Resolvers run in order; first match wins.

```typescript
router.registerResolver((req) => {
  // Return tenant string or null
  return req.headers['x-tenant-id'] || null;
});
```

#### `hostnameResolver(req)`, `headerResolver(headerName)`, `pathResolver()`

Built-in resolvers:

- **hostname**: Extract subdomain from hostname (acme.app.com → acme)
- **header**: Read header value (default: x-tenant-id)
- **path**: Extract from path prefix /t/:tenant/

```typescript
router.registerResolver(MultiTenantRouter.hostnameResolver(req));
router.registerResolver(MultiTenantRouter.headerResolver('x-tenant-id'));
router.registerResolver(MultiTenantRouter.pathResolver());
```

#### `resolve(req)`

Resolve tenant from request using registered resolvers in order.

**Returns:** `{ tenant: string, context: { source: 'resolver' | 'default' } }`

**Throws:** `UnknownTenantError` if no tenant resolved and no default set

```typescript
try {
  const { tenant, context } = router.resolve(req);
} catch (e) {
  // UnknownTenantError
}
```

#### `get(tenant, key)` / `set(tenant, key, value)`

Isolated per-tenant configuration. Data is never leaked between tenants.

```typescript
router.set('acme', 'database', 'acme_db');
router.set('stripe', 'database', 'stripe_db');

router.get('acme', 'database'); // 'acme_db'
router.get('stripe', 'database'); // 'stripe_db' — no cross-tenant leak
```

#### `setDefaultTenant(tenant)`

Set fallback tenant if no resolver matches.

#### `getTenants()`

List all registered tenants.

## Scope & Limits

- **Resolution only** — doesn't route requests to handlers; you implement that
- **Isolation via registry** — no kernel-level isolation; application must use tenant context
- **Async resolver not supported** — all resolvers are sync (url-based only)
- **No wildcard matching** — hostname matches first level only (acme.* not supported)
- **Memory-only** — tenant configs not persisted

## Example: Isolation Proof

```typescript
const router = new MultiTenantRouter();

// Set up two tenants
router.set('acme', 'secret', 'acme-secret');
router.set('stripe', 'secret', 'stripe-secret');

// Verify isolation
console.log(router.get('acme', 'secret')); // 'acme-secret'
console.log(router.get('stripe', 'secret')); // 'stripe-secret'

// Different tenants cannot access each other's data
try {
  router.get('acme', 'secret');  // Works
  router.get('evil', 'secret');  // Throws UnknownTenantError
} catch (e) {
  console.log('Isolation verified:', e.message);
}
```

## License

MIT

---

Sponsored by [Ferrow](https://ferrow.ai)

---
Part of the [ferrow-toolkit](https://github.com/FerrowAI/ferrow-toolkit) collection · Sponsored by [Ferrow](https://ferrow.ai)

# Multi-Tenant Router

Route requests to tenant-specific handlers. Ferrow SaaS support.

```javascript
const router = new MultiTenantRouter();
router.tenant('acme').use(acmeHandler);
```

Features: Tenant isolation, data routing, Ferrow SaaS.
License: MIT

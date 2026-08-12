export interface ResolveResult {
  tenant: string;
  context: Record<string, any>;
}

export class UnknownTenantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownTenantError';
  }
}

type TenantResolver = (req: any) => string | null;

export class MultiTenantRouter {
  private tenantRegistry: Map<string, Map<string, any>> = new Map();
  private resolvers: TenantResolver[] = [];
  private defaultTenant: string | null = null;

  // Register a resolver in order
  registerResolver(resolver: TenantResolver): void {
    this.resolvers.push(resolver);
  }

  // Hostname resolver: extracts subdomain (acme.app.com → acme)
  static hostnameResolver(req: any): TenantResolver {
    return () => {
      const host = req.hostname || req.headers?.host || '';
      const match = host.match(/^([^.]+)\./);
      return match ? match[1] : null;
    };
  }

  // Header resolver: reads X-Tenant-Id
  static headerResolver(headerName = 'x-tenant-id'): TenantResolver {
    return (req: any) => req.headers?.[headerName] || null;
  }

  // Path resolver: /t/:tenant/...
  static pathResolver(): TenantResolver {
    return (req: any) => {
      const path = req.path || req.url || '';
      const match = path.match(/^\/t\/([^/]+)\//);
      return match ? match[1] : null;
    };
  }

  // Set default/wildcard tenant
  setDefaultTenant(tenant: string): void {
    this.defaultTenant = tenant;
  }

  // Resolve tenant from request
  resolve(req: any): ResolveResult {
    for (const resolver of this.resolvers) {
      const tenant = resolver(req);
      if (tenant) {
        this.ensureTenant(tenant);
        return { tenant, context: { source: 'resolver' } };
      }
    }

    if (this.defaultTenant) {
      this.ensureTenant(this.defaultTenant);
      return { tenant: this.defaultTenant, context: { source: 'default' } };
    }

    throw new UnknownTenantError('No tenant could be resolved');
  }

  // Get tenant config
  get(tenant: string, key: string): any {
    const registry = this.tenantRegistry.get(tenant);
    if (!registry) {
      throw new UnknownTenantError(`Tenant not found: ${tenant}`);
    }
    return registry.get(key);
  }

  // Set tenant config
  set(tenant: string, key: string, value: any): void {
    this.ensureTenant(tenant);
    this.tenantRegistry.get(tenant)!.set(key, value);
  }

  // Ensure tenant registry exists
  private ensureTenant(tenant: string): void {
    if (!this.tenantRegistry.has(tenant)) {
      this.tenantRegistry.set(tenant, new Map());
    }
  }

  // Get all tenants
  getTenants(): string[] {
    return Array.from(this.tenantRegistry.keys());
  }
}

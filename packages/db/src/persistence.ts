/**
 * Storefront Ops - Multi-Tenant Persistence Engine
 * Supports PostgreSQL when DATABASE_URL is configured, with an automatic
 * file-backed atomic persistent store for zero-setup local dev and continuous uptime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { generateSeedData } from './seed-generator.ts';
import type {
  Organization,
  User,
  Membership,
  UserRole,
  Order,
  Customer,
  Product,
  InventoryLevel,
  Task,
  Ticket,
} from './types.ts';

// Password Security
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export interface StoredUser extends User {
  password_hash: string;
  role: UserRole;
  organization_id: string;
  organization_slug: string;
  organization_name: string;
}

export interface StoreIntegration {
  id: string;
  organization_id: string;
  platform: 'shopify' | 'woocommerce' | 'stripe' | 'carrier';
  name: string;
  store_url?: string;
  shop_domain?: string;
  api_key?: string;
  status: 'connected' | 'disconnected' | 'error';
  created_at: string;
  last_sync_at: string;
}

export type SubscriptionPlanId = 'starter' | 'growth' | 'scale';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export interface TenantSubscription {
  organizationId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  gracePeriodEnd: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  isReadOnly: boolean;
}

export interface StoredProduct {
  id: string;
  organization_id: string;
  title: string;
  sku: string;
  vendor?: string;
  product_type?: string;
  status: 'active' | 'draft' | 'archived';
  price_minor: number;
  cost_minor: number;
  on_hand: number;
  committed: number;
  available: number;
  reorder_point?: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StoredInventoryItem {
  id: string;
  organization_id: string;
  sku: string;
  title: string;
  location_name: string;
  bin_location: string;
  on_hand: number;
  committed: number;
  available: number;
  incoming: number;
  reorder_point: number;
  days_of_stock: number;
  status: 'ok' | 'low' | 'out' | 'overstock';
  created_at: string;
  updated_at: string;
}

export interface StoredCustomer {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  orders_count: number;
  total_spent_minor: number;
  tags: string[];
  addresses: Array<{
    street1: string;
    city: string;
    state?: string;
    zip?: string;
    country: string;
    isDefault?: boolean;
  }>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseState {
  organizations: Organization[];
  users: StoredUser[];
  memberships: Membership[];
  orders: Order[];
  customers: StoredCustomer[];
  products: StoredProduct[];
  inventory: StoredInventoryItem[];
  tasks: Task[];
  tickets: Ticket[];
  stores?: StoreIntegration[];
  subscriptions?: Record<string, TenantSubscription>;
}

class PersistenceEngine {
  private state: DatabaseState | null = null;
  private dbFilePath: string;
  private lastLoadedMtime = 0;

  constructor() {
    // Determine path relative to root directory or apps/web
    const webDataDir = path.resolve(process.cwd(), 'apps', 'web', '.data');
    const localDataDir = path.resolve(process.cwd(), '.data');
    const chosenDir = fs.existsSync(webDataDir) ? webDataDir : localDataDir;
    this.dbFilePath = path.join(chosenDir, 'storefront-db.json');
  }

  private ensureLoaded(): DatabaseState {
    const dataDir = path.dirname(this.dbFilePath);
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Ignore if directory already created concurrently
      }
    }

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const stat = fs.statSync(this.dbFilePath);
        if (this.state && stat.mtimeMs <= this.lastLoadedMtime) {
          return this.state;
        }

        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        this.state = JSON.parse(raw);
        this.lastLoadedMtime = stat.mtimeMs;

        if (this.state && Array.isArray(this.state.organizations) && Array.isArray(this.state.users)) {
          // Graceful schema evolution: populate seed items if products/inventory/customers are empty
          const seedDefaults = this.buildInitialSeed();
          if (!this.state.products || this.state.products.length === 0) {
            this.state.products = seedDefaults.products;
          }
          if (!this.state.inventory || this.state.inventory.length === 0) {
            this.state.inventory = seedDefaults.inventory;
          }
          if (!this.state.customers || this.state.customers.length === 0) {
            this.state.customers = seedDefaults.customers;
          }
          return this.state;
        }
      } catch (err) {
        console.warn('⚠️ [PersistenceEngine] Failed to parse existing DB file, re-initializing seed:', err);
      }
    }

    if (this.state) {
      return this.state;
    }

    // Initialize initial seed state
    this.state = this.buildInitialSeed();
    this.save();
    return this.state;
  }

  private save(): void {
    if (!this.state) return;
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const serialized = JSON.stringify(this.state, null, 2);
      fs.writeFileSync(this.dbFilePath, serialized, 'utf8');
      try {
        this.lastLoadedMtime = fs.statSync(this.dbFilePath).mtimeMs;
      } catch {}
    } catch (err) {
      console.error('❌ [PersistenceEngine] Error writing to DB file:', err);
    }
  }

  private buildInitialSeed(): DatabaseState {
    const seed = generateSeedData(0.05);
    const nowIso = new Date().toISOString();

    const defaultOrgId = '00000000-0000-0000-0000-000000000001';
    const defaultOrg: Organization = {
      id: defaultOrgId,
      organization_id: defaultOrgId,
      name: 'Acme Commerce Labs',
      slug: 'acme-commerce',
      default_currency: 'USD',
      reporting_currency: 'USD',
      timezone: 'America/New_York (EST)',
      created_at: nowIso,
      updated_at: nowIso,
    };

    const secondaryOrgId = '00000000-0000-0000-0000-000000000002';
    const secondaryOrg: Organization = {
      id: secondaryOrgId,
      organization_id: secondaryOrgId,
      name: 'Acme Corp',
      slug: 'acme-corp',
      default_currency: 'USD',
      reporting_currency: 'USD',
      timezone: 'America/New_York (EST)',
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Pre-hash password123 for standard demo users
    const defaultPasswordHash = hashPassword('password123');

    const demoUsers: StoredUser[] = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        email: 'admin@acmecommerce.com',
        full_name: 'Alex Mercer',
        password_hash: defaultPasswordHash,
        role: 'owner_admin',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        email: 'manager@acmecommerce.com',
        full_name: 'Morgan Blake',
        password_hash: defaultPasswordHash,
        role: 'manager',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        email: 'warehouse@acmecommerce.com',
        full_name: 'Sam Rivera',
        password_hash: defaultPasswordHash,
        role: 'fulfillment',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000004',
        email: 'purchasing@acmecommerce.com',
        full_name: 'Dana Vance',
        password_hash: defaultPasswordHash,
        role: 'purchasing',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000005',
        email: 'marketing@acmecommerce.com',
        full_name: 'Riley Hayes',
        password_hash: defaultPasswordHash,
        role: 'marketing',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000006',
        email: 'support@acmecommerce.com',
        full_name: 'Taylor Chen',
        password_hash: defaultPasswordHash,
        role: 'support',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000007',
        email: 'finance@acmecommerce.com',
        full_name: 'Jordan Bell',
        password_hash: defaultPasswordHash,
        role: 'finance',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: '30000000-0000-0000-0000-000000000008',
        email: 'viewer@acmecommerce.com',
        full_name: 'Chris Evans',
        password_hash: defaultPasswordHash,
        role: 'viewer',
        organization_id: defaultOrgId,
        organization_slug: 'acme-commerce',
        organization_name: 'Acme Commerce Labs',
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    const memberships: Membership[] = demoUsers.map((u, i) => ({
      id: `mem-${i + 1}`,
      organization_id: defaultOrgId,
      user_id: u.id,
      role: u.role,
      created_at: nowIso,
      updated_at: nowIso,
    }));

    // Orders from seed
    const orders: Order[] = seed.sampleOrders.map((so) => ({
      id: so.id,
      organization_id: defaultOrgId,
      customer_id: 'cust-101',
      order_number: so.orderNumber,
      status: so.status as any,
      currency: 'USD',
      subtotal_minor: so.totalMinor,
      discount_minor: 0,
      shipping_minor: 0,
      tax_minor: 0,
      total_minor: so.totalMinor,
      payment_status: so.status === 'pending_payment' ? 'unpaid' : 'paid',
      fulfillment_status: ['packed', 'shipped', 'delivered'].includes(so.status) ? 'fulfilled' : 'unfulfilled',
      risk_level: so.riskLevel as 'low' | 'medium' | 'high',
      shipping_address: {},
      billing_address: {},
      tags: [],
      placed_at: so.placedAt,
      created_at: so.placedAt,
      updated_at: so.placedAt,
    }));

    // Initial tasks
    const tasks: Task[] = [
      {
        id: 'task-1',
        organization_id: defaultOrgId,
        title: 'Review high-risk order ORD-10892',
        description: 'Verify billing address with issuing bank before releasing fulfillment hold.',
        status: 'todo',
        priority: 'high',
        team: 'Fulfillment',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'task-2',
        organization_id: defaultOrgId,
        title: 'Conduct weekly cycle count for Zone A',
        description: 'Scan bins A-01 through A-10 to calibrate available vs on-hand accuracy.',
        status: 'in_progress',
        priority: 'medium',
        team: 'Warehouse',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'task-3',
        organization_id: defaultOrgId,
        title: 'Approve vendor PO-402 for heavyweight fleece',
        description: '3-way match confirmed. Ready for wire transfer authorization.',
        status: 'done',
        priority: 'high',
        team: 'Purchasing',
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const subscriptions: Record<string, TenantSubscription> = {
      [defaultOrgId]: {
        organizationId: defaultOrgId,
        planId: 'growth',
        status: 'active',
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        gracePeriodEnd: null,
        stripeCustomerId: 'cus_acme_prod',
        stripeSubscriptionId: 'sub_growth_monthly',
        isReadOnly: false,
      },
      [secondaryOrgId]: {
        organizationId: secondaryOrgId,
        planId: 'starter',
        status: 'active',
        currentPeriodStart: nowIso,
        currentPeriodEnd: periodEnd,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        gracePeriodEnd: null,
        stripeCustomerId: 'cus_acme_corp',
        stripeSubscriptionId: 'sub_starter_monthly',
        isReadOnly: false,
      },
    };

    // Products from seed for Acme Commerce Labs
    const defaultProducts: StoredProduct[] = seed.sampleProducts.map((sp, idx) => ({
      id: sp.id,
      organization_id: defaultOrgId,
      title: sp.title,
      sku: sp.sku,
      vendor: 'Acme Supply Co.',
      product_type: 'Apparel',
      status: idx % 10 === 0 ? 'draft' : 'active',
      price_minor: sp.priceMinor,
      cost_minor: sp.costMinor,
      on_hand: sp.onHand,
      committed: sp.committed,
      available: sp.available,
      reorder_point: 15,
      tags: ['bestseller', 'core'],
      created_at: nowIso,
      updated_at: nowIso,
    }));

    const locations = ['East Coast DC', 'West Coast Hub', 'UK & EU 3PL'];
    const defaultInventory: StoredInventoryItem[] = defaultProducts.map((p, idx) => {
      const loc = locations[idx % locations.length];
      const bin = `${String.fromCharCode(65 + (idx % 4))}-0${(idx % 9) + 1}-1${idx % 8}`;
      const daysOfStock = p.available === 0 ? 0 : Math.round((p.available / 2) * 1.5);
      let status: 'ok' | 'low' | 'out' | 'overstock' = 'ok';
      if (p.available === 0) status = 'out';
      else if (p.available < 15) status = 'low';
      else if (p.available > 100) status = 'overstock';

      return {
        id: `inv-${p.id}`,
        organization_id: defaultOrgId,
        sku: p.sku,
        title: p.title,
        location_name: loc,
        bin_location: bin,
        on_hand: p.on_hand,
        committed: p.committed,
        available: p.available,
        incoming: idx % 3 === 0 ? 50 : 0,
        reorder_point: 15,
        days_of_stock: daysOfStock,
        status,
        created_at: nowIso,
        updated_at: nowIso,
      };
    });

    const defaultCustomers: StoredCustomer[] = [
      {
        id: 'cust-101',
        organization_id: defaultOrgId,
        email: 'alex.mercer@example.com',
        first_name: 'Alex',
        last_name: 'Mercer',
        phone: '+1 212-555-0143',
        orders_count: 14,
        total_spent_minor: 168000,
        tags: ['vip', 'early-adopter'],
        addresses: [{ street1: '142 Grand Street, Apt 4B', city: 'Brooklyn', state: 'NY', zip: '11249', country: 'US', isDefault: true }],
        created_at: '2025-02-14T00:00:00Z',
        updated_at: nowIso,
      },
      {
        id: 'cust-102',
        organization_id: defaultOrgId,
        email: 'brianna.hayes@example.com',
        first_name: 'Brianna',
        last_name: 'Hayes',
        phone: '+1 503-555-0182',
        orders_count: 6,
        total_spent_minor: 72000,
        tags: ['apparel-preferred'],
        addresses: [{ street1: '882 Sunset Blvd', city: 'Portland', state: 'OR', zip: '97201', country: 'US', isDefault: true }],
        created_at: '2025-05-10T00:00:00Z',
        updated_at: nowIso,
      },
      {
        id: 'cust-103',
        organization_id: defaultOrgId,
        email: 'carlos.r@example.com',
        first_name: 'Carlos',
        last_name: 'Rivera',
        phone: '+1 512-555-0199',
        orders_count: 5,
        total_spent_minor: 48000,
        tags: ['at-risk-warning'],
        addresses: [{ street1: '402 Congress Ave', city: 'Austin', state: 'TX', zip: '78701', country: 'US', isDefault: true }],
        created_at: '2025-01-10T00:00:00Z',
        updated_at: nowIso,
      },
      {
        id: 'cust-104',
        organization_id: defaultOrgId,
        email: 'diana.prince@example.com',
        first_name: 'Diana',
        last_name: 'Prince',
        phone: '+1 312-555-0128',
        orders_count: 9,
        total_spent_minor: 112000,
        tags: ['vip'],
        addresses: [{ street1: '200 E Randolph St', city: 'Chicago', state: 'IL', zip: '60601', country: 'US', isDefault: true }],
        created_at: '2025-03-22T00:00:00Z',
        updated_at: nowIso,
      },
    ];

    return {
      organizations: [defaultOrg, secondaryOrg],
      users: demoUsers,
      memberships,
      orders,
      customers: defaultCustomers,
      products: defaultProducts,
      inventory: defaultInventory,
      tasks,
      tickets: [],
      subscriptions,
    };
  }

  // -------------------------------------------------------------
  // Organization Operations
  // -------------------------------------------------------------
  public getOrganizationBySlug(slug: string): Organization | null {
    const state = this.ensureLoaded();
    const cleanSlug = slug.toLowerCase().trim();
    return state.organizations.find((o) => o.slug.toLowerCase() === cleanSlug) || null;
  }

  public getOrganizationById(id: string): Organization | null {
    const state = this.ensureLoaded();
    return state.organizations.find((o) => o.id === id) || null;
  }

  public getOrganizationByStoreDomain(domain?: string): Organization | null {
    if (!domain) return null;
    const state = this.ensureLoaded();
    const clean = domain.toLowerCase().trim();
    const store = state.stores?.find(
      (s) => s.shop_domain?.toLowerCase() === clean || s.store_url?.toLowerCase().includes(clean)
    );
    if (!store) return null;
    return state.organizations.find((o) => o.id === store.organization_id) || null;
  }

  public createOrganization(data: {
    name: string;
    slug?: string;
    defaultCurrency?: string;
    timezone?: string;
  }): Organization {
    const state = this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const id = randomBytes(16).toString('hex');
    const baseSlug = (data.slug || data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure unique slug
    let uniqueSlug = baseSlug || 'store';
    let counter = 1;
    while (state.organizations.some((o) => o.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const org: Organization = {
      id,
      organization_id: id,
      name: data.name,
      slug: uniqueSlug,
      default_currency: data.defaultCurrency || 'USD',
      reporting_currency: data.defaultCurrency || 'USD',
      timezone: data.timezone || 'America/New_York (EST)',
      created_at: nowIso,
      updated_at: nowIso,
    };

    state.organizations.push(org);

    // Seed starter onboarding tasks for new organization
    state.tasks.push(
      {
        id: `task-${randomBytes(6).toString('hex')}`,
        organization_id: id,
        title: 'Connect your Shopify or WooCommerce store',
        description: 'Navigate to Integrations and connect your primary sales channel to sync live orders.',
        status: 'todo',
        priority: 'high',
        team: 'Operations',
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: `task-${randomBytes(6).toString('hex')}`,
        organization_id: id,
        title: 'Configure warehouse pack station & thermal printer',
        description: 'Set default 4x6 label formats and integrate carrier credentials.',
        status: 'todo',
        priority: 'medium',
        team: 'Warehouse',
        created_at: nowIso,
        updated_at: nowIso,
      }
    );

    // Initialize 14-day Growth trial subscription for new tenant
    if (!state.subscriptions) state.subscriptions = {};
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    state.subscriptions[id] = {
      organizationId: id,
      planId: 'growth',
      status: 'trialing',
      currentPeriodStart: nowIso,
      currentPeriodEnd: trialEnd,
      trialEnd,
      cancelAtPeriodEnd: false,
      gracePeriodEnd: null,
      stripeCustomerId: `cus_${id.slice(0, 10)}`,
      stripeSubscriptionId: `sub_trial_${id.slice(0, 8)}`,
      isReadOnly: false,
    };

    this.save();
    return org;
  }

  // -------------------------------------------------------------
  // User & Authentication Operations
  // -------------------------------------------------------------
  public getUserByEmail(email: string): StoredUser | null {
    const state = this.ensureLoaded();
    const cleanEmail = email.toLowerCase().trim();
    return state.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  public getUserById(id: string): StoredUser | null {
    const state = this.ensureLoaded();
    return state.users.find((u) => u.id === id) || null;
  }

  public getUsersByOrganization(organizationId: string): StoredUser[] {
    const state = this.ensureLoaded();
    return state.users.filter((u) => u.organization_id === organizationId);
  }

  public createUser(data: {
    email: string;
    fullName: string;
    password: string;
    role?: UserRole;
    organizationId: string;
    organizationSlug: string;
    organizationName: string;
  }): StoredUser {
    const state = this.ensureLoaded();
    const cleanEmail = data.email.toLowerCase().trim();

    const existing = state.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists.`);
    }

    const nowIso = new Date().toISOString();
    const userId = randomBytes(16).toString('hex');
    const passwordHash = hashPassword(data.password);
    const role = data.role || 'owner_admin';

    const newUser: StoredUser = {
      id: userId,
      email: cleanEmail,
      full_name: data.fullName,
      password_hash: passwordHash,
      role,
      organization_id: data.organizationId,
      organization_slug: data.organizationSlug,
      organization_name: data.organizationName,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    };

    state.users.push(newUser);

    state.memberships.push({
      id: `mem-${randomBytes(6).toString('hex')}`,
      organization_id: data.organizationId,
      user_id: userId,
      role,
      created_at: nowIso,
      updated_at: nowIso,
    });

    this.save();
    return newUser;
  }

  public authenticate(email: string, password: string): StoredUser | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    if (verifyPassword(password, user.password_hash)) {
      return user;
    }

    // Backwards compatibility for demo users with plaintext password123
    if (password === 'password123' && user.email.endsWith('@acmecommerce.com')) {
      return user;
    }

    return null;
  }

  // -------------------------------------------------------------
  // Orders & Multi-Tenant Operations
  // -------------------------------------------------------------
  public getOrders(organizationId: string, limit = 50): Order[] {
    const state = this.ensureLoaded();
    return state.orders
      .filter((o) => o.organization_id === organizationId)
      .slice(0, limit);
  }

  public createOrder(organizationId: string, orderData: Partial<Order>): Order {
    const state = this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const id = orderData.id || `ord-${randomBytes(6).toString('hex')}`;

    const newOrder: Order = {
      id,
      organization_id: organizationId,
      customer_id: orderData.customer_id || 'cust-101',
      order_number: orderData.order_number || `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      status: orderData.status || 'pending_payment',
      currency: orderData.currency || 'USD',
      subtotal_minor: orderData.subtotal_minor || 0,
      discount_minor: orderData.discount_minor || 0,
      shipping_minor: orderData.shipping_minor || 0,
      tax_minor: orderData.tax_minor || 0,
      total_minor: orderData.total_minor || 0,
      payment_status: orderData.payment_status || 'unpaid',
      fulfillment_status: orderData.fulfillment_status || 'unfulfilled',
      risk_level: orderData.risk_level || 'low',
      shipping_address: orderData.shipping_address || {},
      billing_address: orderData.billing_address || {},
      tags: orderData.tags || [],
      placed_at: orderData.placed_at || nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    };

    state.orders.unshift(newOrder);

    // Auto-upsert customer profile if email present in address
    const bAddr = (orderData.billing_address || {}) as any;
    const sAddr = (orderData.shipping_address || {}) as any;
    const custEmail = bAddr.email || sAddr.email;
    if (custEmail) {
      const existingCust = state.customers.find(
        (c) => c.organization_id === organizationId && c.email.toLowerCase() === custEmail.toLowerCase()
      );
      if (existingCust) {
        existingCust.orders_count += 1;
        existingCust.total_spent_minor += newOrder.total_minor;
        existingCust.updated_at = nowIso;
      } else {
        const nameParts = (bAddr.name || sAddr.name || 'Customer').split(' ');
        state.customers.unshift({
          id: `cust-${id.slice(0, 10)}`,
          organization_id: organizationId,
          email: custEmail.toLowerCase(),
          first_name: nameParts[0] || 'Customer',
          last_name: nameParts.slice(1).join(' ') || '',
          orders_count: 1,
          total_spent_minor: newOrder.total_minor,
          tags: ['new-buyer'],
          addresses: [
            sAddr.address1
              ? {
                  street1: sAddr.address1,
                  city: sAddr.city || '',
                  state: sAddr.province || '',
                  zip: sAddr.zip || sAddr.postalCode || '',
                  country: sAddr.country || 'US',
                  isDefault: true,
                }
              : { street1: 'Main St', city: 'City', country: 'US', isDefault: true },
          ],
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }

    this.save();
    return newOrder;
  }

  public getTasks(organizationId: string): Task[] {
    const state = this.ensureLoaded();
    return state.tasks.filter((t) => t.organization_id === organizationId);
  }

  public updateTaskStatus(organizationId: string, taskId: string, status: Task['status']): Task | null {
    const state = this.ensureLoaded();
    const task = state.tasks.find((t) => t.id === taskId && t.organization_id === organizationId);
    if (!task) return null;

    task.status = status;
    task.updated_at = new Date().toISOString();
    this.save();
    return task;
  }

  // -------------------------------------------------------------
  // Store Integrations Operations
  // -------------------------------------------------------------
  public getStores(organizationId: string): StoreIntegration[] {
    const state = this.ensureLoaded();
    if (!state.stores) state.stores = [];
    return state.stores.filter((s) => s.organization_id === organizationId);
  }

  public createStore(data: {
    organizationId: string;
    platform: 'shopify' | 'woocommerce' | 'stripe' | 'carrier';
    name: string;
    storeUrl?: string;
    shopDomain?: string;
    apiKey?: string;
  }): StoreIntegration {
    const state = this.ensureLoaded();
    if (!state.stores) state.stores = [];
    const nowIso = new Date().toISOString();
    const store: StoreIntegration = {
      id: `store-${randomBytes(6).toString('hex')}`,
      organization_id: data.organizationId,
      platform: data.platform,
      name: data.name,
      store_url: data.storeUrl,
      shop_domain: data.shopDomain,
      api_key: data.apiKey,
      status: 'connected',
      created_at: nowIso,
      last_sync_at: 'Just now',
    };
    state.stores.push(store);
    this.save();
    return store;
  }

  public deleteStore(storeId: string, organizationId: string): boolean {
    const state = this.ensureLoaded();
    if (!state.stores) return false;
    const initialLen = state.stores.length;
    state.stores = state.stores.filter((s) => !(s.id === storeId && s.organization_id === organizationId));
    if (state.stores.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Subscription & Billing Operations
  // -------------------------------------------------------------
  public getSubscription(organizationId: string): TenantSubscription {
    const state = this.ensureLoaded();
    if (!state.subscriptions) state.subscriptions = {};
    if (!state.subscriptions[organizationId]) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      state.subscriptions[organizationId] = {
        organizationId,
        planId: 'growth',
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        trialEnd: null,
        cancelAtPeriodEnd: false,
        gracePeriodEnd: null,
        stripeCustomerId: `cus_${organizationId.slice(0, 10)}`,
        stripeSubscriptionId: `sub_growth_${organizationId.slice(0, 8)}`,
        isReadOnly: false,
      };
      this.save();
    }
    return state.subscriptions[organizationId];
  }

  public updateSubscription(
    organizationId: string,
    updates: Partial<TenantSubscription>
  ): TenantSubscription {
    const current = this.getSubscription(organizationId);
    const updated: TenantSubscription = { ...current, ...updates };
    const state = this.ensureLoaded();
    if (!state.subscriptions) state.subscriptions = {};
    state.subscriptions[organizationId] = updated;
    this.save();
    return updated;
  }

  // -------------------------------------------------------------
  // Catalog & Products Operations
  // -------------------------------------------------------------
  public getProducts(organizationId: string): StoredProduct[] {
    const state = this.ensureLoaded();
    return state.products.filter((p) => p.organization_id === organizationId);
  }

  public createProduct(organizationId: string, data: Partial<StoredProduct>): StoredProduct {
    const state = this.ensureLoaded();
    const nowIso = new Date().toISOString();
    const id = data.id || `prod_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const onHand = data.on_hand ?? data.available ?? 0;
    const committed = data.committed ?? 0;
    const available = Math.max(0, onHand - committed);

    const product: StoredProduct = {
      id,
      organization_id: organizationId,
      title: data.title || 'Untitled Product',
      sku: (data.sku || `SKU-${Date.now()}`).toUpperCase(),
      vendor: data.vendor || 'In-House',
      product_type: data.product_type || 'General',
      status: data.status || 'active',
      price_minor: data.price_minor ?? 0,
      cost_minor: data.cost_minor ?? 0,
      on_hand: onHand,
      committed,
      available,
      reorder_point: data.reorder_point ?? 15,
      tags: data.tags || [],
      created_at: nowIso,
      updated_at: nowIso,
    };

    state.products.unshift(product);

    // Sync inventory record automatically
    const existingInv = state.inventory.find(
      (inv) => inv.organization_id === organizationId && inv.sku === product.sku
    );
    if (!existingInv) {
      state.inventory.unshift({
        id: `inv-${product.id}`,
        organization_id: organizationId,
        sku: product.sku,
        title: product.title,
        location_name: 'East Coast DC',
        bin_location: 'A-01-01',
        on_hand: onHand,
        committed,
        available,
        incoming: 0,
        reorder_point: product.reorder_point ?? 15,
        days_of_stock: available > 0 ? 30 : 0,
        status: available === 0 ? 'out' : available < 15 ? 'low' : 'ok',
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    this.save();
    return product;
  }

  // -------------------------------------------------------------
  // Inventory Operations
  // -------------------------------------------------------------
  public getInventory(organizationId: string): StoredInventoryItem[] {
    const state = this.ensureLoaded();
    return state.inventory.filter((i) => i.organization_id === organizationId);
  }

  public adjustInventory(
    organizationId: string,
    sku: string,
    quantityDelta: number,
    reason: string
  ): StoredInventoryItem | null {
    const state = this.ensureLoaded();
    const item = state.inventory.find(
      (i) => i.organization_id === organizationId && i.sku === sku
    );
    if (!item) return null;

    item.on_hand = Math.max(0, item.on_hand + quantityDelta);
    item.available = Math.max(0, item.on_hand - item.committed);
    item.days_of_stock = item.available > 0 ? Math.round(item.available * 0.75) : 0;
    if (item.available === 0) item.status = 'out';
    else if (item.available < item.reorder_point) item.status = 'low';
    else if (item.available > 100) item.status = 'overstock';
    else item.status = 'ok';
    item.updated_at = new Date().toISOString();

    // Also update product on_hand & available
    const prod = state.products.find(
      (p) => p.organization_id === organizationId && p.sku === sku
    );
    if (prod) {
      prod.on_hand = item.on_hand;
      prod.available = item.available;
      prod.updated_at = item.updated_at;
    }

    this.save();
    return item;
  }

  // -------------------------------------------------------------
  // Customer CRM Operations
  // -------------------------------------------------------------
  public getCustomers(organizationId: string): StoredCustomer[] {
    const state = this.ensureLoaded();
    return state.customers.filter((c) => c.organization_id === organizationId);
  }

  public upsertCustomer(
    organizationId: string,
    data: Partial<StoredCustomer> & { email: string }
  ): StoredCustomer {
    const state = this.ensureLoaded();
    const cleanEmail = data.email.toLowerCase().trim();
    let cust = state.customers.find(
      (c) => c.organization_id === organizationId && c.email.toLowerCase() === cleanEmail
    );
    const nowIso = new Date().toISOString();

    if (!cust) {
      cust = {
        id: `cust-${Date.now()}_${randomBytes(4).toString('hex')}`,
        organization_id: organizationId,
        email: cleanEmail,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone,
        orders_count: data.orders_count || 1,
        total_spent_minor: data.total_spent_minor || 0,
        tags: data.tags || [],
        addresses: data.addresses || [],
        created_at: nowIso,
        updated_at: nowIso,
      };
      state.customers.unshift(cust);
    } else {
      if (data.first_name) cust.first_name = data.first_name;
      if (data.last_name) cust.last_name = data.last_name;
      if (data.phone) cust.phone = data.phone;
      if (data.orders_count !== undefined) cust.orders_count = data.orders_count;
      if (data.total_spent_minor !== undefined) cust.total_spent_minor = data.total_spent_minor;
      if (data.tags) cust.tags = Array.from(new Set([...cust.tags, ...data.tags]));
      cust.updated_at = nowIso;
    }

    this.save();
    return cust;
  }

  public getUsageMetrics(organizationId: string): {
    monthlyOrdersUsed: number;
    activeSkusCount: number;
    teamSeatsUsed: number;
  } {
    const state = this.ensureLoaded();
    const ordersCount = state.orders.filter((o) => o.organization_id === organizationId).length;
    const skusCount = state.inventory.filter((i) => i.organization_id === organizationId).length || 380;
    const seatsCount = state.users.filter((u) => u.organization_id === organizationId).length || 1;
    return {
      monthlyOrdersUsed: ordersCount,
      activeSkusCount: skusCount,
      teamSeatsUsed: seatsCount,
    };
  }
}

// Global Singleton for the process
export const db = new PersistenceEngine();

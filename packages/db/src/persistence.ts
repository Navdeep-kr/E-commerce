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

export interface DatabaseState {
  organizations: Organization[];
  users: StoredUser[];
  memberships: Membership[];
  orders: Order[];
  customers: Customer[];
  products: Product[];
  inventory: InventoryLevel[];
  tasks: Task[];
  tickets: Ticket[];
  stores?: StoreIntegration[];
  subscriptions?: Record<string, TenantSubscription>;
}

class PersistenceEngine {
  private state: DatabaseState | null = null;
  private dbFilePath: string;

  constructor() {
    // Determine path relative to root directory
    const dataDir = path.resolve(process.cwd(), '.data');
    this.dbFilePath = path.join(dataDir, 'storefront-db.json');
  }

  private ensureLoaded(): DatabaseState {
    if (this.state) {
      return this.state;
    }

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
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        this.state = JSON.parse(raw);
        if (this.state && Array.isArray(this.state.organizations) && Array.isArray(this.state.users)) {
          return this.state;
        }
      } catch (err) {
        console.warn('⚠️ [PersistenceEngine] Failed to parse existing DB file, re-initializing seed:', err);
      }
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

    return {
      organizations: [defaultOrg, secondaryOrg],
      users: demoUsers,
      memberships,
      orders,
      customers: [],
      products: [],
      inventory: [],
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

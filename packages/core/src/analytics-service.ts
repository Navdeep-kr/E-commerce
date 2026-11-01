/**
 * Storefront Ops Core: Analytics, BI & Safe Parameterized Query Compiler
 * Playbook Step 12 (Spec Part 3.14): Centralized Metric Dictionary and Safe Parameterized SQL Generator
 */

export interface MetricDefinition {
  id: string;
  name: string;
  category: 'financial' | 'sales' | 'marketing' | 'operations';
  description: string;
  unit: 'currency_minor' | 'basis_points' | 'ratio' | 'count' | 'percentage';
  sqlFormula: string;
}

export const METRIC_DICTIONARY: Record<string, MetricDefinition> = {
  net_sales: {
    id: 'net_sales',
    name: 'Net Sales',
    category: 'financial',
    description: 'Gross order revenue minus returns, discounts, and customer allowances in integer cents.',
    unit: 'currency_minor',
    sqlFormula: 'SUM(total_amount_minor - refund_amount_minor)',
  },
  gross_sales: {
    id: 'gross_sales',
    name: 'Gross Sales',
    category: 'sales',
    description: 'Total initial order charge before returns or post-order discounts.',
    unit: 'currency_minor',
    sqlFormula: 'SUM(subtotal_minor + shipping_amount_minor + tax_amount_minor)',
  },
  cogs: {
    id: 'cogs',
    name: 'Cost of Goods Sold (COGS)',
    category: 'financial',
    description: 'Direct inventory acquisition and manufacturing cost based on weighted average unit cost.',
    unit: 'currency_minor',
    sqlFormula: 'SUM(cogs_amount_minor)',
  },
  gross_margin_bps: {
    id: 'gross_margin_bps',
    name: 'Gross Margin (bps)',
    category: 'financial',
    description: 'Gross profit expressed in basis points (100 bps = 1.00%).',
    unit: 'basis_points',
    sqlFormula: 'ROUND(((SUM(total_amount_minor - refund_amount_minor) - SUM(cogs_amount_minor))::numeric / NULLIF(SUM(total_amount_minor - refund_amount_minor), 0)) * 10000)',
  },
  aov: {
    id: 'aov',
    name: 'Average Order Value (AOV)',
    category: 'sales',
    description: 'Net sales divided by total placed orders in integer cents.',
    unit: 'currency_minor',
    sqlFormula: 'ROUND(SUM(total_amount_minor)::numeric / NULLIF(COUNT(id), 0))',
  },
  roas: {
    id: 'roas',
    name: 'Return on Ad Spend (ROAS)',
    category: 'marketing',
    description: 'Channel-attributed revenue divided by channel ad spend.',
    unit: 'ratio',
    sqlFormula: 'ROUND(SUM(attributed_revenue_minor)::numeric / NULLIF(SUM(ad_spend_minor), 0), 2)',
  },
  mer: {
    id: 'mer',
    name: 'Marketing Efficiency Ratio (MER)',
    category: 'marketing',
    description: 'Total blended storefront gross sales divided by total ad spend across all channels.',
    unit: 'ratio',
    sqlFormula: 'ROUND(SUM(gross_sales_minor)::numeric / NULLIF(SUM(total_ad_spend_minor), 0), 2)',
  },
  cac: {
    id: 'cac',
    name: 'Customer Acquisition Cost (CAC)',
    category: 'marketing',
    description: 'Ad spend divided by count of new first-time customers acquired.',
    unit: 'currency_minor',
    sqlFormula: 'ROUND(SUM(ad_spend_minor)::numeric / NULLIF(COUNT(DISTINCT new_customer_id), 0))',
  },
  orders_count: {
    id: 'orders_count',
    name: 'Order Count',
    category: 'operations',
    description: 'Total number of orders processed.',
    unit: 'count',
    sqlFormula: 'COUNT(id)',
  },
  units_sold: {
    id: 'units_sold',
    name: 'Units Sold',
    category: 'sales',
    description: 'Total physical units fulfilled across order line items.',
    unit: 'count',
    sqlFormula: 'SUM(quantity)',
  },
};

export const ALLOWED_DIMENSIONS = [
  'date_day',
  'channel',
  'sku',
  'customer_segment',
  'order_status',
] as const;

export type DimensionKey = (typeof ALLOWED_DIMENSIONS)[number];

const DIMENSION_COLUMNS: Record<DimensionKey, string> = {
  date_day: 'DATE_TRUNC(\'day\', created_at)::date',
  channel: 'sales_channel',
  sku: 'sku',
  customer_segment: 'customer_segment',
  order_status: 'status',
};

export interface ReportQueryFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number;
}

export interface ReportQueryDefinition {
  organizationId: string;
  dimensions: DimensionKey[];
  metrics: string[];
  startDateIso: string;
  endDateIso: string;
  filters?: ReportQueryFilter[];
  orderBy?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
  limit?: number;
}

export interface CompiledSqlQuery {
  sql: string;
  params: (string | number)[];
}

export class AnalyticsService {
  /**
   * Get dictionary definition for a metric
   */
  static getMetricDefinition(metricId: string): MetricDefinition | undefined {
    return METRIC_DICTIONARY[metricId];
  }

  /**
   * Compile a Custom Report Definition into a Safe Parameterized SQL Query
   * Enforces:
   * 1. Tenant Isolation: organization_id is always parameterized as $1
   * 2. Parameterization: dates, filters, limits are passed via $2, $3, ...
   * 3. Whitelist: Only strictly allowed dimensions and metric formulas are permitted
   */
  static compileSafeQuery(def: ReportQueryDefinition): CompiledSqlQuery {
    if (!def.organizationId) {
      throw new Error('Organization ID is strictly required for tenant-scoped query generation.');
    }

    const params: (string | number)[] = [];

    // Param 1: organization_id
    params.push(def.organizationId);
    const orgParamIndex = params.length;

    // Param 2: startDate
    params.push(def.startDateIso);
    const startDateParamIndex = params.length;

    // Param 3: endDate
    params.push(def.endDateIso);
    const endDateParamIndex = params.length;

    // Build SELECT projections
    const selectProjections: string[] = [];

    for (const dim of def.dimensions) {
      const col = DIMENSION_COLUMNS[dim];
      if (!col) {
        throw new Error(`Unauthorized or invalid dimension: "${dim}"`);
      }
      selectProjections.push(`${col} AS ${dim}`);
    }

    for (const metricId of def.metrics) {
      const metric = METRIC_DICTIONARY[metricId];
      if (!metric) {
        throw new Error(`Unauthorized or unrecognized metric: "${metricId}"`);
      }
      selectProjections.push(`${metric.sqlFormula} AS ${metricId}`);
    }

    if (selectProjections.length === 0) {
      throw new Error('Query must select at least one dimension or metric.');
    }

    // Build WHERE clauses
    const whereClauses: string[] = [
      `organization_id = $${orgParamIndex}`,
      `created_at >= $${startDateParamIndex}`,
      `created_at <= $${endDateParamIndex}`,
    ];

    // Optional filters
    if (def.filters && def.filters.length > 0) {
      for (const f of def.filters) {
        // Sanitize field name: only alphanumeric and underscores allowed
        if (!/^[a-zA-Z0-9_]+$/.test(f.field)) {
          throw new Error(`Illegal characters in filter field: "${f.field}"`);
        }
        params.push(f.value);
        const filterParamIndex = params.length;
        whereClauses.push(`${f.field} ${f.operator} $${filterParamIndex}`);
      }
    }

    // Build GROUP BY
    let groupByClause = '';
    if (def.dimensions.length > 0) {
      const groupByProjections = def.dimensions.map((d) => DIMENSION_COLUMNS[d]);
      groupByClause = `\nGROUP BY ${groupByProjections.join(', ')}`;
    }

    // Build ORDER BY
    let orderByClause = '';
    if (def.orderBy) {
      const orderField = def.orderBy.field;
      // Allow sorting only by requested dimensions or metrics
      const isValidSortField = def.dimensions.includes(orderField as any) || def.metrics.includes(orderField);
      if (!isValidSortField) {
        throw new Error(`Cannot sort by unselected field: "${orderField}"`);
      }
      const dir = def.orderBy.direction === 'DESC' ? 'DESC' : 'ASC';
      orderByClause = `\nORDER BY ${orderField} ${dir}`;
    }

    // Build LIMIT
    let limitClause = '';
    if (def.limit && Number.isInteger(def.limit) && def.limit > 0) {
      params.push(Math.min(def.limit, 1000));
      limitClause = `\nLIMIT $${params.length}`;
    }

    const sql = `SELECT\n  ${selectProjections.join(',\n  ')}\nFROM orders\nWHERE ${whereClauses.join(' AND ')}${groupByClause}${orderByClause}${limitClause};`;

    return {
      sql,
      params,
    };
  }
}

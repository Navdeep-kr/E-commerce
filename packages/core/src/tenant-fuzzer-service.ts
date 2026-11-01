/**
 * Multi-Tenant Boundary Fuzzer & Penetration Testing Service
 * Evaluates request envelopes against 100+ hostile cross-tenant probes, SQL injections, header spoofing, and privilege escalation attempts.
 */

export interface FuzzingRequestEnvelope {
  sessionOrgId: string;
  userRole: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, any>;
}

export interface FuzzingEvaluationResult {
  isSafe: boolean;
  isBlocked: boolean;
  enforcedOrgId: string;
  violationReason?: string;
  attackCategory?: 'cross_tenant_probe' | 'header_spoof' | 'sql_injection' | 'path_traversal' | 'xss_injection' | 'null_byte_attack';
}

export class TenantFuzzerService {
  private readonly sqlInjectionPatterns: RegExp[];
  private readonly pathTraversalPatterns: RegExp[];
  private readonly xssPatterns: RegExp[];

  constructor() {
    this.sqlInjectionPatterns = [
      /'\s*or\s+['"\w]+\s*=\s*['"\w]+/i,
      /'\s*or\s+1\s*=\s*1/i,
      /--/i,
      /union\s+(all\s+)?select/i,
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*truncate/i,
      /exec\s*\(/i,
      /['";]\s*--/i,
    ];

    this.pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%252e%252e%252f/i,
      /\/etc\/passwd/i,
      /\/windows\/system32/i,
    ];

    this.xssPatterns = [
      /<script\b[^>]*>/i,
      /javascript\s*:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
    ];
  }

  /**
   * Evaluate an incoming request envelope to guarantee tenant isolation and safety
   */
  public evaluateRequest(envelope: FuzzingRequestEnvelope): FuzzingEvaluationResult {
    const { sessionOrgId, headers, query, body } = envelope;

    if (!sessionOrgId) {
      return {
        isSafe: false,
        isBlocked: true,
        enforcedOrgId: '',
        violationReason: 'Missing authenticated session tenant boundary.',
      };
    }

    // 1. Check for Header Spoofing (e.g. attempting to override tenant with custom headers)
    const spoofHeaderKeys = [
      'x-tenant-id',
      'x-organization-id',
      'x-forwarded-tenant',
      'x-org-slug',
      'tenant_id',
    ];

    for (const key of spoofHeaderKeys) {
      const headerVal = headers[key] || headers[key.toLowerCase()];
      if (headerVal && headerVal.toLowerCase() !== sessionOrgId.toLowerCase()) {
        return {
          isSafe: false,
          isBlocked: true,
          enforcedOrgId: sessionOrgId,
          violationReason: `Hostile header spoofing detected on '${key}'. Value '${headerVal}' does not match authenticated session '${sessionOrgId}'.`,
          attackCategory: 'header_spoof',
        };
      }
    }

    // 2. Check for Query Parameter Tenant Tampering
    const queryTenantKeys = ['orgid', 'organization_id', 'tenant', 'org_slug', 'store_id'];
    for (const [k, v] of Object.entries(query)) {
      if (queryTenantKeys.includes(k.toLowerCase()) && v) {
        if (v.toLowerCase() !== sessionOrgId.toLowerCase()) {
          return {
            isSafe: false,
            isBlocked: true,
            enforcedOrgId: sessionOrgId,
            violationReason: `Cross-tenant query parameter tampering detected on '${k}'. Value '${v}' blocked.`,
            attackCategory: 'cross_tenant_probe',
          };
        }
      }

      // Check for SQL injection in query params
      for (const pattern of this.sqlInjectionPatterns) {
        if (pattern.test(v)) {
          return {
            isSafe: false,
            isBlocked: true,
            enforcedOrgId: sessionOrgId,
            violationReason: `SQL injection pattern detected in query param '${k}'.`,
            attackCategory: 'sql_injection',
          };
        }
      }

      // Check for path traversal in query params
      for (const pattern of this.pathTraversalPatterns) {
        if (pattern.test(v)) {
          return {
            isSafe: false,
            isBlocked: true,
            enforcedOrgId: sessionOrgId,
            violationReason: `Path traversal attempt detected in query param '${k}'.`,
            attackCategory: 'path_traversal',
          };
        }
      }
    }

    // 3. Check for Body Payload Tenant Smuggling
    const checkObject = (obj: any, path: string = ''): FuzzingEvaluationResult | null => {
      if (!obj || typeof obj !== 'object') return null;

      for (const [key, val] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;

        if (
          (key.toLowerCase() === 'organization_id' || key.toLowerCase() === 'orgid') &&
          typeof val === 'string'
        ) {
          if (val.toLowerCase() !== sessionOrgId.toLowerCase()) {
            return {
              isSafe: false,
              isBlocked: true,
              enforcedOrgId: sessionOrgId,
              violationReason: `Cross-tenant payload smuggling detected at '${fullPath}'. Provided '${val}' does not match session '${sessionOrgId}'.`,
              attackCategory: 'cross_tenant_probe',
            };
          }
        }

        if (typeof val === 'string') {
          // Check SQL injection
          for (const pattern of this.sqlInjectionPatterns) {
            if (pattern.test(val)) {
              return {
                isSafe: false,
                isBlocked: true,
                enforcedOrgId: sessionOrgId,
                violationReason: `SQL injection payload detected at '${fullPath}'.`,
                attackCategory: 'sql_injection',
              };
            }
          }

          // Check Path traversal
          for (const pattern of this.pathTraversalPatterns) {
            if (pattern.test(val)) {
              return {
                isSafe: false,
                isBlocked: true,
                enforcedOrgId: sessionOrgId,
                violationReason: `Path traversal payload detected at '${fullPath}'.`,
                attackCategory: 'path_traversal',
              };
            }
          }

          // Check XSS
          for (const pattern of this.xssPatterns) {
            if (pattern.test(val)) {
              return {
                isSafe: false,
                isBlocked: true,
                enforcedOrgId: sessionOrgId,
                violationReason: `Cross-site scripting (XSS) payload detected at '${fullPath}'.`,
                attackCategory: 'xss_injection',
              };
            }
          }

          // Check Null Byte
          if (val.includes('\0') || val.includes('%00') || val.includes('\u0000')) {
            return {
              isSafe: false,
              isBlocked: true,
              enforcedOrgId: sessionOrgId,
              violationReason: `Null byte injection detected at '${fullPath}'.`,
              attackCategory: 'null_byte_attack',
            };
          }
        } else if (typeof val === 'object') {
          const nested = checkObject(val, fullPath);
          if (nested) return nested;
        }
      }
      return null;
    };

    const bodyCheck = checkObject(body);
    if (bodyCheck) {
      return bodyCheck;
    }

    // If completely clean, guarantee tenant boundary is strictly locked to sessionOrgId
    return {
      isSafe: true,
      isBlocked: false,
      enforcedOrgId: sessionOrgId,
    };
  }

  /**
   * Generates a 100-vector hostile attack test matrix for automated fuzz testing
   */
  public generateHostileFuzzingVectors(targetSessionOrg: string = 'acme-corp'): FuzzingRequestEnvelope[] {
    const vectors: FuzzingRequestEnvelope[] = [];

    // 1. 25 Header Spoofing Vectors
    const headerKeys = ['x-tenant-id', 'x-organization-id', 'x-forwarded-tenant', 'tenant_id'];
    const maliciousTenants = ['evil-corp', 'rival-brand', 'tenant_999', 'admin', 'system_root', 'competitor'];
    for (let i = 0; i < 25; i++) {
      const headerKey = headerKeys[i % headerKeys.length];
      const malTenant = maliciousTenants[i % maliciousTenants.length];
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: { [headerKey]: malTenant },
        query: {},
        body: {},
      });
    }

    // 2. 25 Query Parameter Tampering Vectors
    const queryKeys = ['orgId', 'organization_id', 'tenant', 'org_slug'];
    for (let i = 0; i < 25; i++) {
      const qKey = queryKeys[i % queryKeys.length];
      const malTenant = maliciousTenants[i % maliciousTenants.length];
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: {},
        query: { [qKey]: `${malTenant}_${i}` },
        body: {},
      });
    }

    // 3. 20 Body Tenant Smuggling Vectors (including nested structures)
    for (let i = 0; i < 20; i++) {
      const malTenant = maliciousTenants[i % maliciousTenants.length];
      const isNested = i % 2 === 0;
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: {},
        query: {},
        body: isNested
          ? { order: { customer: { organization_id: `${malTenant}_nested_${i}` } } }
          : { organization_id: `${malTenant}_flat_${i}`, amountCents: 1000 },
      });
    }

    // 4. 15 SQL Injection Vectors in Query & Body
    const sqlPayloads = [
      "' OR 1=1 --",
      "admin' --",
      "1; DROP TABLE orders; --",
      "UNION SELECT password_hash FROM auth.users",
      "' OR 'a'='a",
      "1; DELETE FROM inventory_movements",
      "1; TRUNCATE TABLE customers",
    ];
    for (let i = 0; i < 15; i++) {
      const sql = sqlPayloads[i % sqlPayloads.length];
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: {},
        query: { search: sql },
        body: { filter: sql },
      });
    }

    // 5. 10 Path Traversal Vectors
    const pathPayloads = [
      "../../etc/passwd",
      "..\\..\\windows\\system32",
      "%2e%2e%2f%2e%2e%2fetc/passwd",
      "../../../secrets.json",
    ];
    for (let i = 0; i < 10; i++) {
      const path = pathPayloads[i % pathPayloads.length];
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: {},
        query: { file: path },
        body: { path },
      });
    }

    // 6. 5 XSS and Null Byte Vectors
    const xssPayloads = [
      "<script>alert('xss')</script>",
      "javascript:alert(1)",
      "<img src=x onerror=alert(1)>",
      "data\0hidden",
      "admin%00secret",
    ];
    for (let i = 0; i < 5; i++) {
      const payload = xssPayloads[i % xssPayloads.length];
      vectors.push({
        sessionOrgId: targetSessionOrg,
        userRole: 'manager',
        headers: {},
        query: { input: payload },
        body: { name: payload },
      });
    }

    return vectors;
  }
}

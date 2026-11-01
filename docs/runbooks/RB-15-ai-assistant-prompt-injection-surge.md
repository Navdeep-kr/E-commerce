# Runbook RB-15: AI Assistant Prompt Injection Surge & Abuse

**Severity**: P1 - CRITICAL  
**Alert Trigger**: `ai_prompt_injection_attempts_rate > 10` per minute or LLM token expenditure surge $> 300\%$ baseline.

---

## 1. Symptoms & Impact
* Malicious prompts detected attempting system prompt extraction, cross-tenant data probing, or filter bypasses.
* AI Assistant endpoint latency elevates and tenant LLM token budgets are drained rapidly.

## 2. Immediate Triage & Diagnostics
1. Inspect AI security logs for recent injection attempts:
   ```json
   {
     "event": "prompt_injection_detected",
     "tenant_id": "org_7712",
     "user_id": "usr_9981",
     "matched_pattern": "ignore previous instructions",
     "sanitized": true
   }
   ```
2. Determine if requests originate from a compromised user account or automated bot scanning.
3. Verify that zero system prompts or cross-tenant data were returned in previous responses.

## 3. Mitigation & Recovery Steps
1. **Temporarily Suspend Offending User / Session**:
   * Lock the user account triggering excessive injection attempts and revoke active session JWTs.
2. **Enable Aggressive AI Rate-Limiting**:
   * Throttle AI Copilot requests to maximum 5 requests per user per minute:
     ```bash
     redis-cli SET "ai_rate_limit:usr_9981" 5 EX 1800
     ```
3. **Update Prompt Sanitizer Patterns**:
   * If novel injection vector was identified, add the corresponding regex pattern to `AIAssistantService.injectionPatterns`.
4. **Audit Response Logs**:
   * Verify all blocked responses returned standard safe security error message with no LLM inference leakage.
5. **Verify Recovery**:
   * Blocked injection attempts drop; normal tenant queries process with clean safety scores and $< 1.5\text{s}$ response times.

## Summary of Changes
Provide a concise overview of what this PR introduces or fixes.

## Module / Step
- Playbook Step: Step __
- Spec Section: Part __

## Definition of Done Checklist (Appendix B)
- [ ] Matches the spec and acceptance criteria in writing
- [ ] Permission checks verified on server and UI (RBAC)
- [ ] Loading, empty, error, and permission-denied states implemented
- [ ] Unit, integration, or e2e tests added/updated
- [ ] Audit log entries and timeline events written for destructive/key mutations
- [ ] Accessible by keyboard (WCAG AA); works on mobile/scanner where relevant
- [ ] Zero floating-point arithmetic for currency (minor integer units only)
- [ ] All stock changes routed through append-only `inventory_movements`
- [ ] No hardcoded secrets; validated against `src/env.ts`
- [ ] CI lint, typecheck, and test suites are 100% green

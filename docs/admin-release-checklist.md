# Admin Panel Release Checklist

## Pre-Deploy

- [ ] Run SQL hardening script in Supabase SQL Editor.
- [ ] Verify new admin API environment variables are present.
- [ ] Run `npm run build` successfully.
- [ ] Run lint check for admin modules.

## Security Verification

- [ ] Test admin login with each role (`super_admin`, `admin`, `moderator`).
- [ ] Confirm non-admin roles cannot access `/:locale/admin/*`.
- [ ] Confirm admin mutation requests require `X-Idempotency-Key`.
- [ ] Confirm duplicate idempotency requests return `409`.
- [ ] Confirm `security_events` is append-only (update/delete blocked).

## Functional QA

- [ ] Users module: single + bulk actions work.
- [ ] Projects module: single + bulk close/delete work.
- [ ] Offers module: single + bulk accept/reject/delete work.
- [ ] Reports module: resolve/reopen/remove target, including bulk.
- [ ] Audit Logs page: filters, pagination, and CSV export work.
- [ ] Feature Flags page: create/toggle/delete works.
- [ ] System Settings page: JSON save/delete works.
- [ ] Analytics and Overview load correctly with refresh actions.

## Production Smoke

- [ ] Validate `/api/admin/health` returns status `ok`.
- [ ] Validate `/api/admin/alerts` shows expected thresholds.
- [ ] Verify maintenance banner toggle from admin security page.
- [ ] Verify audit logs are written for every sensitive action.

## Post-Deploy

- [ ] Monitor logs for 30 minutes for elevated error rates.
- [ ] Validate no unexpected spike in warning/critical events.
- [ ] Announce release internally with rollback plan.

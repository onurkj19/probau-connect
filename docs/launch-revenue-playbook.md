# ProBau Launch & Revenue Playbook

This runbook is the minimum path to launch publicly, start applications, and generate revenue.

## 1) Production Readiness (must complete)

1. Run pending SQL in Supabase production:
   - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;`
   - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;`
   - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;`
   - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;`
   - `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line TEXT;`
   - `ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS custom_category TEXT;`
2. Set environment variables in Vercel:
   - Supabase + Stripe keys (already used by app)
   - `VITE_GA_MEASUREMENT_ID` (new)
3. Verify core flows on production:
   - Register/Login
   - Post project
   - Submit offer
   - Start chat + notifications
   - Admin moderation (ban/unban, verify/unverify, project actions)
4. Verify billing enforcement:
   - Contractor without active plan cannot submit offer
   - Contractor with active plan can submit offer

## 2) Launch Day Checklist

1. Publish platform URL and short value proposition.
2. Announce "Project Owners post free".
3. Announce "Contractors need subscription to apply".
4. Add 5-10 demo projects so marketplace is not empty.
5. Manually onboard first 10 contractors (direct outreach).

## 3) 14-Day Revenue Sprint

### Days 1-3: Supply seeding
- Contact 30-50 project owners (construction companies, property managers).
- Help them post projects quickly.
- Goal: at least 15 active projects.

### Days 4-7: Demand seeding
- Contact 50-80 contractors (email + WhatsApp + phone).
- Pitch: paid plan gives access to active tenders + direct chat.
- Goal: 10 checkout starts.

### Days 8-10: Conversion push
- Follow-up all leads that started but did not pay.
- Offer limited onboarding support and first-week assistance.
- Goal: first 5 paid subscriptions.

### Days 11-14: Optimization
- Check GA events and conversion drop-off.
- Improve CTA copy and onboarding points where drop-off is highest.
- Goal: reach 10+ paid contractors.

## 4) KPI Targets (weekly)

- New registrations
- Active projects posted
- Offer submissions
- Checkout starts (`checkout_start`)
- Paid conversions (from Stripe)
- D7 retention for contractors

## 5) Outreach Templates

### Project Owner outreach (short)
Subject: Free posting of construction tenders in Switzerland

Hello,  
We run ProBau.ch, a marketplace where project owners publish tenders for free and receive offers from qualified contractors.  
Would you like us to help publish your next project this week?

### Contractor outreach (short)
Subject: New active tenders matching your services

Hello,  
ProBau.ch has active construction projects where contractors can apply directly and chat with project owners.  
If you want, I can send you onboarding steps and help activate your profile today.

## 6) Non-Negotiable Operating Rules

- Keep super-admin accounts untouchable.
- Keep contact details protected for non-qualified/guest users.
- Enforce subscription before offer submission.
- Review reports and moderation actions daily.

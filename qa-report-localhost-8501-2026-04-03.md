# QA Report — language-coach (localhost:8501)
**Date:** 2026-04-03
**Branch:** main
**Mode:** Full
**Duration:** ~20 min
**Pages visited:** Landing, /intro, /intro/session, /login, /signup, /forgot-password, footer links
**Screenshots:** 14
**Framework:** React SPA (Vite + React Router)
**Health Score:** 62/100

---

## Summary

| Severity | Count |
|----------|-------|
| High     | 2     |
| Medium   | 2     |
| Low      | 3     |
| **Total**| **7** |

| Category     | Score | Weight | Weighted |
|--------------|-------|--------|---------|
| Console      | 70    | 15%    | 10.5    |
| Links        | 55    | 10%    | 5.5     |
| Visual       | 77    | 10%    | 7.7     |
| Functional   | 85    | 20%    | 17.0    |
| UX           | 62    | 15%    | 9.3     |
| Performance  | 80    | 10%    | 8.0     |
| Content      | 77    | 5%     | 3.85    |
| Accessibility| 0     | 15%    | 0       |
| **Total**    |       |        | **61.85** |

---

## Top 3 Things to Fix

1. **[HIGH] Scroll animations make the landing page look broken** — 4 sections (How it works, Features, Testimonials, CTA) are invisible on page load due to opacity-0 scroll animations. The containers still take their full height, creating ~2300px of blank white space between the hero and footer. On mobile this is ~3800px of blank space — the page looks completely empty.

2. **[HIGH] Auth pages fail WCAG contrast** — Secondary text and links on Login, Signup, and Forgot Password pages (e.g. "Don't have an Account?", "← Back to login") are effectively invisible. Dark gray text on a near-black (#111) background with an estimated contrast ratio of ~1.5:1 vs the required 4.5:1. This is a release-gate issue per DESIGN.md.

3. **[MEDIUM] Footer links are dead (About, Privacy, Terms)** — All three navigate to `/#`, returning to the top of the landing page. These are placeholder links that don't go anywhere.

---

## Console Health

**400 error persists across sessions** — A `Failed to load resource: 400 (Bad Request)` error appears in the console on every page. It appears to originate from a Firebase Auth Emulator request (login attempt from a previous session) and persists in browser storage. Not a blocking bug but clutters the console.

---

## Issues

---

### ISSUE-001 [HIGH] — Scroll animations render 2300px of blank whitespace on landing page

**Category:** UX / Visual
**Reproducible:** Yes — every fresh page load

**Description:**
The landing page uses IntersectionObserver-triggered fade-in animations on 4 sections: "How it works", "Features (Structured Lessons / Topic Conversations / Freestyle Chat)", "What learners say", and "Ready to start your language journey?". Each section's content container has `opacity: 0` on initial render and only fades in when scrolled into view. However, the invisible containers still occupy their full height (550–580px each).

On desktop, 3 of the 4 animated sections are below the initial viewport, making the page appear to have ~2300px of empty space between the hero and the footer. On mobile (375px viewport), ALL 4 sections are below the fold — the entire page below the hero looks blank (~3800px of white space).

**Evidence:** See `screenshots/initial-viewport.png` — only the hero and "Languages" section are visible; the other 4 sections show as white gaps.

**Repro:**
1. Navigate to `http://localhost:8501` (fresh page, no scroll)
2. Observe: below the hero section, the page shows large blank white areas
3. The "How it works" section background border is visible but content is invisible
4. Scroll down — content fades in one section at a time

**Impact:** First-time visitors see a broken-looking page. Conversion rate will be severely hurt.

---

### ISSUE-002 [HIGH] — Auth pages: secondary text and links have near-zero contrast

**Category:** Accessibility
**Reproducible:** Yes

**Description:**
On `/login`, `/signup`, and `/forgot-password`, the text outside the white card (page background is near-black `#111`) is rendered in a very dark gray that is barely distinguishable from the background. Affected text:
- "Don't have an Account?" (login page)
- "Already have an Account?" (signup page)
- "← Back to login" (forgot-password page)

Estimated contrast ratio: ~1.5:1. WCAG 2.2 AA requires 4.5:1 for normal text. Per `CLAUDE.md`: "Accessibility is a release gate."

**Evidence:** See `screenshots/login-flow.png`, `screenshots/signup-page.png`, `screenshots/forgot-password.png`

**Repro:**
1. Navigate to `/login`
2. Look at the text below the white card: "Don't have an Account? **Sign up**"
3. The non-link portion is nearly invisible

---

### ISSUE-003 [MEDIUM] — Footer links (About, Privacy, Terms) navigate to `/#`

**Category:** Functional / Links
**Reproducible:** Yes

**Description:**
Clicking About, Privacy, or Terms in the footer navigates to `http://localhost:8501/#` — the top of the landing page — instead of dedicated pages. These are unimplemented placeholder links.

**Evidence:** Confirmed via browser navigation log — all three resolve to `/#`.

**Repro:**
1. Scroll to footer of landing page
2. Click "About" → returns to top of page (URL: `/#`)
3. Click "Privacy" → same
4. Click "Terms" → same

---

### ISSUE-004 [MEDIUM] — Login error exposes raw Firebase SDK error text

**Category:** UX / Content
**Reproducible:** Yes

**Description:**
When a user enters an email that doesn't exist, the error shown is:
> `Firebase: Error (auth/user-not-found).`

This exposes the underlying auth provider and SDK error codes to the user. It should show a generic message like "Incorrect email or password."

**Evidence:** See `screenshots/login-error.png`

**Repro:**
1. Go to `/login`
2. Enter `invalid@test.com` / `wrongpassword`
3. Click "Log In"
4. Observe raw Firebase error message

---

### ISSUE-005 [LOW] — "Try it" links in Features section gate behind signup

**Category:** UX / Functional
**Reproducible:** Yes

**Description:**
The "Try it →" links on the 3 feature cards (Structured Lessons, Topic Conversations, Freestyle Chat) on the landing page all navigate to `/signup`. This hard-gates users behind account creation before they can experience the product — directly contradicting the design policy in CLAUDE.md: "New users must be able to try a meaningful part of the app before signup" and "Auth gating must be progressive."

The "Try a 2-minute demo" hero CTA correctly goes to `/intro` (no signup required). The feature cards should do the same or navigate to relevant sections of the guest intro flow.

**Repro:**
1. Scroll to Features section on landing page
2. Click any "Try it →" link
3. Lands on `/signup` instead of the guest experience

---

### ISSUE-006 [LOW] — Forgot Password page missing a heading

**Category:** Accessibility / UX
**Reproducible:** Yes

**Description:**
The `/forgot-password` page has no visible `<h1>` or page heading. The card starts directly with descriptive text: "No worries! Enter your email and we'll send you a reset link." without establishing page context. Screen readers announcing this page would have no heading to announce. Browser tab title may also not update.

**Evidence:** See `screenshots/forgot-password.png`

---

### ISSUE-007 [LOW] — Intro flow offers 4 languages; landing page advertises 8

**Category:** Content
**Reproducible:** Yes

**Description:**
The "Languages you can learn" section on the landing page lists 8 languages: Spanish, French, Japanese, German, Italian, Portuguese, Korean, Chinese. The guest intro form at `/intro` only offers 4: Spanish, French, Japanese, German. A user attracted by Italian, Portuguese, Korean, or Chinese will find those options missing.

**Repro:**
1. Note the 8 languages listed on the landing page
2. Click "Try a 2-minute demo"
3. Observe only 4 languages available in the intro form

---

## What Works Well

- **Guest intro flow** — Works end-to-end. Language + goal + topic selection, AI coaching reply generation, and the "Save your momentum" upsell all function correctly.
- **Guest session page** — Clean layout, clear value proposition, good upsell copy.
- **Form validation** — Native browser validation on signup form correctly prevents empty submission.
- **Routing** — All implemented routes (/, /intro, /intro/session, /login, /signup, /forgot-password) return 200 and render correctly.
- **No JS errors** on any page.
- **Responsive nav** — Header collapses cleanly on mobile.
- **Hand-drawn design system** — Consistent use of the card/button style throughout.

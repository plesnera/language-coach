# language-coach Design System
This document is the source of truth for product and UI design decisions in language-coach.
## Product intent
language-coach should feel warm, human, and encouraging while still being clear and trustworthy for both learners and admins.
The design direction is **A-lite**: preserve the current hand-drawn personality, but improve hierarchy, readability, consistency, and accessibility.
## Core principles
1. **Accessible first**
- Every screen and interaction must be usable with keyboard, screen reader, and high-contrast settings.
- Accessibility is not a polish phase; it is a release requirement.
2. **Try before signup**
- A new user must be able to experience a meaningful part of the product before creating an account.
- Signup is introduced after value is demonstrated, not before.
3. **Warm but confident**
- Keep playful hand-drawn cues, but reduce noise and improve visual structure.
- The UI should feel friendly without looking immature.
4. **Clear action hierarchy**
- Primary actions are visually obvious.
- Destructive and secondary actions are visually distinct and never ambiguous.
5. **Progressive commitment**
- Ask for account creation at moments where the benefit is obvious.
- Explain what users gain, not just what the app needs.
## Visual system
### Palette
- Background/Paper: `#FAFAF8`
- Ink/Text: `#1A1A1A`
- Red/Destructive: `#DC2626`
- Amber/AI guidance: `#F59E0B`
- Green/Success: `#24C26A`
- Blue/Trust + key actions: `#2257E6` (new A-lite accent; use intentionally, not everywhere)
### Typography
- Display/headings: `Lora` (default)
- Body/UI: `Inter` (default)
- Optional experimental variants (feature-flagged only): `Fraunces` for display, `Instrument Sans` for UI
- Data-dense admin metadata may use a monospace helper font when it improves scanability.
### Shape and component language
- Preserve hand-drawn rounded geometry and slightly irregular card/input borders.
- Keep tactile shadows and outlined controls, but avoid excessive decoration in dense workflows.
- Use spacing and typography for hierarchy before adding additional color or ornament.
## Interaction and behavior
### Feedback
- Success, warning, error, and info states must be inline and perceivable without color alone.
- No browser `alert()` or `confirm()` for core UX flows.
### Form behavior
- Every input has an explicit label.
- Validation errors are linked to the relevant field and announced accessibly.
- Save/retry states are visible and non-blocking where possible.
### Loading and async states
- Show clear loading indicators for long-running actions.
- Disable actions only when necessary; communicate why an action is unavailable.
## Accessibility requirements (mandatory)
All new UI and design updates must satisfy these requirements:
1. **Target standard**
- Meet WCAG 2.2 AA minimum for contrast, semantics, interaction, and focus behavior.
2. **Keyboard**
- Full keyboard navigation for all interactive controls.
- No keyboard traps.
- Visible focus indicator with sufficient contrast.
3. **Semantics**
- Use semantic HTML where possible (`button`, `nav`, `main`, headings in order, table semantics for tabular data).
- Icon-only controls require accessible names.
4. **Forms**
- Programmatic labels (`label`/`aria-label` as appropriate).
- Programmatic error association (`aria-describedby`, inline error text).
- Required/invalid states are explicit.
5. **Color and contrast**
- Do not use color as the only status signal.
- Text and interactive contrast must satisfy AA.
6. **Motion and animation**
- Respect `prefers-reduced-motion`.
- Avoid flashing or disorienting transitions.
7. **Content readability**
- Plain language and concise microcopy.
- Responsive layouts that remain readable at zoom and on small screens.
## Guest-first intro flow (mandatory)
### Goal
Allow first-time users to experience core product value without signup, then present signup as a clear upgrade path.
### Flow definition
1. **Entry**
- Landing page exposes an immediate “Try it now” action with no auth requirement.
2. **First value moment**
- User can start a short guided interaction (example: mini speaking practice or sample coaching exchange) as a guest.
3. **Soft account offer**
- After the first meaningful value moment, present a non-blocking account prompt.
- Prompt copy focuses on user value:
  - Personalized curriculum
  - Tracking improvement over time
  - Chatting about topics based on user-uploaded content
4. **Progressive gating**
- Guest can complete at least one useful experience before any hard auth wall.
- Require signup when the user tries to save long-term progress, continue a curriculum path, or unlock personalized features.
5. **Continuity**
- Preserve context from guest session where feasible and transfer it after signup so users do not feel they are starting over.
### Signup messaging guidelines
- Lead with benefit, not friction.
- Tone: supportive, concise, and specific.
- Example structure:
  - Title: “Save your momentum”
  - Body: “Create a free account to get a personalized curriculum, track improvement, and chat about your own uploaded content.”
  - Actions: Primary “Create free account”, Secondary “Continue as guest” (when allowed).
## Application by surface
### Marketing / landing
- Clear value proposition, immediate guest trial CTA, and trust-building proof.
### Learner experience
- Strong guidance, clear progress visibility, low cognitive load, and accessible conversation controls.
### Admin experience
- Dense information remains readable, actions are explicit, and destructive flows are safeguarded.
## Non-negotiable release criteria
Changes that violate these criteria are not shippable:
1. A new user cannot try a meaningful product experience before signup.
2. Critical flows are not keyboard-accessible.
3. Contrast, labels, or focus behavior fail AA-level expectations.
4. Signup prompts do not explain the concrete value of creating an account.
5. Destructive actions lack clear affordances and confirmation UX.


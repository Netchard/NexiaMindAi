# Spine Pair Review — NexiaMind AI Accueil

## Overall verdict

This spine pair is strong and close to cleanly implementation-ready. It is unusually well-grounded: color/radius inheritance from `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md` is byte-identical (verified), codebase citations (`Navbar.tsx:31`, `chat/page.tsx:48`, `useAuth.ts`, `AuthProvider.getSafeRedirect`, `src/lib/api/conversations.ts` exports, `src/proxy.ts` `PUBLIC_PAGE_ROUTES`) all check out exactly as described, and every `.memlog.md` decision (including both overrides) traces cleanly into DESIGN.md tokens and EXPERIENCE.md flows/components. Two concrete, mechanically-fixable defects keep this from a clean pass: a stale pre-override shadow value duplicated in two DESIGN.md sections that contradicts the corrected value given in Colors/frontmatter, and an undefined `{colors.ring}` token referenced in EXPERIENCE.md (inherited unfixed from the chat/auth spines). Neither undermines the spine's overall shape or intent; both should be fixed before a dev agent starts building.

## 1. Flow coverage — strong

Checked each `.memlog.md` decision (page replaces `src/app/page.tsx`; per-action auth guard; primary CTA → `/chat`; disabled secondary CTA + tooltip; 3 generic chips → new conversation + send; Codexia chip → search-then-fallback; both product overrides) against EXPERIENCE.md's 3 Key Flows. Each flow has a named protagonist, numbered steps, a `**Climax:**` beat, and either an explicit failure path or an appropriate non-failure variant:
- Flow 1 (Marc) — generic chip → new conversation, with an explicit "Échec" network-failure path.
- Flow 2 (Amina) — Codexia chip → existing-conversation match, with a "Variante" for the no-match case (correctly not framed as a failure).
- Flow 3 (anonymous visitor) — auth-gate redirect, with a "Variante" showing chip-click behaves identically to CTA-click.

Chip order in Interaction Primitives (Codexia, Résume, Explique, Où trouver) matches `reconcile-maquette.md`'s stated maquette order, not `.memlog.md`'s listing order — documented and intentional, not a defect.

### Findings
- **low** No Key Flow walks the single most common path — a connected user clicking the primary CTA (or closing CTA) directly, with no chip involved. It's covered only as a one-line rule in Component Patterns ("Connecté : navigue vers `/chat`") that cross-references chat EXPERIENCE.md's own Flow 1. (EXPERIENCE.md § Key Flows, § Component Patterns row "CTA primaire"). *Fix:* optional — either add a 2-3 step Flow 0 or an explicit sentence tying the CTA click to chat's Flow 1 as its literal entry point.
- **low** `.memlog.md`'s opening event describes the page as "surface unique, form-factor web, **authentifiée**", which contradicts the actual resolved behavior (`/` is a public route per `src/proxy.ts` `PUBLIC_PAGE_ROUTES`, gated per-action, not per-page). EXPERIENCE.md § Foundation correctly overrides this and spines win on conflict, but a reader skimming only the memlog requirement source would be misled. (.memlog.md line 7 vs EXPERIENCE.md § Foundation). *Fix:* none required in the spine; consider a memlog amendment note for future readers.

## 2. Token completeness — adequate (one critical, one high finding)

Extracted every `colors`/`typography`/`rounded`/`spacing`/`components` frontmatter key and every `{path.to.token}` reference in both files' prose. All color tokens carry hex/rgba values (none missing). Nearly every reference resolves — except:

### Findings
- **critical** `{colors.ring}` is referenced in EXPERIENCE.md § Interaction Primitives ("Focus visible : ring 2px `{colors.ring}`... via le token hérité de l'auth/chat") but **no `ring` token exists** in this DESIGN.md, in chat's DESIGN.md, or in auth's DESIGN.md — only `ring-glow` exists (a distinct token, used for the input focus glow, not a ring color). This is the same broken reference already present verbatim in both the chat and auth EXPERIENCE.md files; Accueil's spine repeats it rather than resolving it. A dev implementing the focus ring has no color to resolve to. (EXPERIENCE.md line 92; also chat EXPERIENCE.md line 95, auth EXPERIENCE.md line 81). *Fix:* either add a `ring` color token to one DESIGN.md (auth's, as the root) and have chat/accueil inherit it, or change all three references to the token that actually exists (`{colors.primary}` is used elsewhere as the focus/action color and would be a natural candidate).
- **high** DESIGN.md § Elevation & Depth (line 226) and the `closing-cta` bullet in § Components (line 244) both cite **stale shadow values** left over from before the CTA-gradient override: `rgba(193,78,47,.4)` (line 226) is the pre-override maquette color (`#C14E2F` = rgb(193,78,47), the color the product decision explicitly rejected), and both lines' alpha values (`.4`→`.35` in line 226/244) don't match the actual frontmatter tokens `hero-cta-shadow: rgba(244,105,63,.55)` / `hero-cta-shadow-soft: rgba(244,105,63,.4)`. § Colors (line 196) and the frontmatter itself state the *correct* values — only these two later passages weren't updated when the override was applied. A dev reading only Elevation & Depth or Components (both plausible standalone reads) would implement the wrong shadow. *Fix:* replace `rgba(193,78,47,.4)` / `.35` in both locations with the resolved token values (`rgba(244,105,63,.55)` for `cta-primary`, `rgba(244,105,63,.4)` for `closing-cta`).
- **low** `step-number-badge`'s 46×46px size (DESIGN.md line 242), `hero-eyebrow-badge`'s dot size/halo (line 234: "point 6px", "box-shadow: 0 0 10px"), and the `cta-primary`/`closing-cta` padding difference (16px 28px vs 15px 30px, line 244) are stated only as literal values in prose — not captured as fields in their respective `components:` frontmatter entries, unlike the rest of the file (and unlike chat DESIGN.md's `assistant-avatar.size: 26px`, which *is* a frontmatter field). *Fix:* add `size`/`padding` fields to the relevant `components:` entries.
- **medium** DESIGN.md's frontmatter `description` promises full self-containment ("même valeurs, répétées ici... with homepage-specific component tokens") and delivers on it for `colors` and `rounded` (verified byte-identical to chat DESIGN.md) but not for `typography` or `spacing` — inherited roles (`body`/`label`/`caption`/`panel-title`/`nav-item`, `header-height`/`gutter`/etc.) are only gestured at in a comment, without values. A consumer reading only this file's frontmatter gets complete inherited colors/radii but must still open chat DESIGN.md for inherited type/spacing values. *Fix:* either repeat those tokens too, or soften the "self-contained" claim in the description to name colors/rounded specifically.
- **low** `chips-eyebrow` and `section-display` are documented as components in DESIGN.md's prose § Components (lines 240, 243) with no corresponding entry in the `components:` frontmatter object. Low impact — both are fully specified via existing typography/color tokens referenced inline.

No numeric contrast ratios are stated for any color combination (hero-subheading, step-body-text, etc. against their backgrounds) — consistent with the house style across all three spines in this project (WCAG 2.2 AA cited generically in Accessibility Floor, no per-pair ratios anywhere), so not flagged as a gap unique to this file.

## 3. Component coverage — strong

Every component in DESIGN.md's `components:` frontmatter (`hero-eyebrow-badge`, `hero-heading`, `hero-subheading`, `cta-primary`, `cta-secondary-disabled`, `suggestion-chip`, `step-card`, `step-number-badge`, `closing-cta`) has real behavioral coverage in EXPERIENCE.md § Component Patterns, either 1:1 (CTA primaire, CTA secondaire désactivé, CTA de clôture, Puces de suggestion) or grouped under an umbrella row (`hero-eyebrow-badge`/`hero-heading`/`hero-subheading` under "Hero"; `step-card`/`step-number-badge` under "Explicatif 3 étapes") — consistent with how sibling spines group purely static sub-elements.

### Findings
- **low** EXPERIENCE.md's "Hero" row restates "deux CTA côte à côte" even though CTA primaire/secondaire get their own dedicated rows immediately below — mild redundancy, not a coverage gap.

## 4. State coverage — strong

Walked the single IA surface (`/`). Applicable states (default, hover, hover/focus on the disabled CTA, pressed/pending on chip click, error on conversation-creation failure, not-authenticated) are all covered in § State Patterns with `[ASSUMPTION]` tags where `.memlog.md` didn't specify (multi-click handling, on-page error copy). Cold-load and offline are correctly judged not applicable / folded into the generic network-error row — the page has no data fetch of its own (all content is static; only click-triggered API calls exist), and offline-at-click-time is explicitly named as an example cause in the "Erreur de création de conversation" row. Permission-denied is not applicable (no gated content on this surface).

No findings.

## 5. Visual reference coverage — strong

Only one visual asset exists (`imports/maquette-nexiamind-ai-accueil-2026-07-18.html`; no `mockups/` or `wireframes/` directories). It is referenced specifically and repeatedly — DESIGN.md § Brand & Style, § Colors, § Typography, and § Layout & Spacing each name exactly what it illustrates and where the spine diverges from it (header/footer prototype, CTA gradient, font, avatar-3D zone). EXPERIENCE.md § Information Architecture gives the canonical composition-reference line ("Référence de composition... Spine gagne en cas de conflit"), matching the convention used in both shape-reference examples and in the sibling chat/auth spines. `reconcile-maquette.md` self-declares as reviewer-only notes ("Notes pour la revue humaine") and is correctly not cross-referenced from either spine file — it documents extraction methodology, not a downstream contract dependency. No orphans, no unspecific references.

No findings.

## 6. Bloat & overspecification — strong

No pixel restatement where tokens already cover it beyond the under-tokenization already noted in §2 (that's the inverse problem — missing tokens, not redundant prose). No source-restatement beyond what sibling spines already do as house style (exact microcopy repeated once in DESIGN.md.Components for visual content, once in EXPERIENCE.md Voice and Tone for register — distinct purposes, not duplication). No prose where a table would clearly work better. `[NOTE FOR UX]`/`[ASSUMPTION]` tags are used sparingly and only for genuinely unresolved, load-bearing gaps (avatar-3D scope, disabled-button opacity value, auth redirect target, `ConversationsProvider` architecture question, double-click handling) — not padding.

No findings.

## 7. Inheritance discipline — adequate (same two findings as §2)

`sources` frontmatter in EXPERIENCE.md resolves (`.memlog.md` and chat EXPERIENCE.md both exist). Cross-references to `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md` and `EXPERIENCE.md` verified correct: `app-header` is a real component key in chat DESIGN.md; `#State Patterns` is a real heading anchor in chat EXPERIENCE.md; the auth-login destination correctly points to `../ux-nexiamind-ai-2026-07-04/EXPERIENCE.md` (no `-chat` suffix — a different sibling folder, verified to exist). Repeated `colors`/`rounded` values are byte-identical to chat DESIGN.md — no silent drift. Component names are consistent in spirit across both files, with EXPERIENCE.md occasionally grouping several DESIGN.md component keys under one umbrella behavioral row (see §3) — an accepted pattern also used in the shape-reference examples.

### Findings
- Same as §2: the undefined `{colors.ring}` reference (critical) and the stale shadow values in Elevation & Depth / closing-cta (high) are both inheritance-discipline breaks as much as token-completeness ones — `{colors.ring}` was inherited unfixed from chat/auth's own EXPERIENCE.md, and the stale shadow is an incomplete propagation of Accueil's own override decision across its own file.

## 8. Shape fit — strong

DESIGN.md sections appear in canonical order with none skipped or reordered: Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. EXPERIENCE.md has all 8 required sections in order: Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows. Optional sections (Responsive & Platform, Inspiration & Anti-patterns) are omitted, which the spec allows.

### Findings
- **low** Unlike the chat/auth sibling spines (which both carry a dedicated "Responsive & Platform" breakpoint table), Accueil folds its breakpoint behavior (CTA stacking, chip wrap, 3-col→1-col step grid) into § Layout & Spacing prose. The values given there are precise enough to implement (flex-wrap's natural reflow for CTAs/chips, an explicit `md` breakpoint for the grid), so this is a legitimate but less scannable choice rather than a missing spec. *Fix:* optional — promote to a dedicated table for consistency with siblings.

## Mechanical notes

- No name inconsistencies found beyond the low-severity `chips-eyebrow`/`section-display` frontmatter-vs-prose gap noted in §2.
- No broken cross-refs found except `{colors.ring}` (critical, §2/§7).
- No Mermaid diagrams in either file — n/a.
- Frontmatter completeness: DESIGN.md has `name`/`description`/`status`/`updated` (no `sources` key, correctly — not required per `design-md-spec.md` and absent in both shape-reference DESIGN.md examples). EXPERIENCE.md has `name`/`status`/`sources`/`updated`, both source paths verified to exist.
- Codebase citations spot-checked and all verified exact: `src/components/Navbar/Navbar.tsx:31` (`{ name: 'Accueil', href: '/' }`), `src/app/chat/page.tsx:48` (`onSendMessage(null, content, {})`), `src/components/Auth/useAuth.ts` (exists), `AuthProvider.getSafeRedirect` (exists, `src/components/Auth/AuthProvider.tsx:22`), `src/lib/api/conversations.ts` exports `getConversations`/`createNewConversation`/`sendMessageInConversation` (all present), `src/proxy.ts` `PUBLIC_PAGE_ROUTES` includes `'/'` (confirmed), `src/app/page.tsx` is indeed still the unmodified Next.js starter template (confirmed), and Newsreader is already loaded in `src/app/layout.tsx` at weights 400/500/600/700 (confirmed — covers this spine's use of weight 600 and 700).

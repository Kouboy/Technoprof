# Illustrated interface implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline implementation.

**Goal:** Integrate the approved title and give assignment failures and the viewport frame the same worn pulp identity.
**Architecture:** Native DOM controls over a static embedded title image. One failure atlas behind native bitmap captions. Static Phaser metalwork outside the existing viewport. No simulation changes.
**Tech Stack:** TypeScript, Phaser, Canvas bitmap lettering, native DOM, Vite, offline exports.
**Spec:** art/title-2026-10-23/INTENTION.md and approved concept-v8-wear.png.

## Global Constraints
- Work in the user's existing local atelier checkout; preserve the published 0.61 and main/Pages.
- Keep current driving, enemies, deadlines, controls and automatic-arrival timer suspension.
- One failed assignment continues to the next; only the final report can pronounce radiation.
- Preserve the complete-day HTML launcher and offline operation.
- The blinking prompt is a real accessible start button, remains visible on focus and with reduced motion.
- Keep the exact '(c) 2026 Brainrot Interactive Software' and '<Press Start to Teach>' strings.
- Preserve VIEW = x7 y7 width306 height168, floor163 and HUD y179.
- No effects added to the driving render loop. Frame drawn once at scene creation.

## Review Focus
- Enter/Space or a touch on title starts exactly once; settings/commands never accidentally start a day.
- Small mobile portrait/landscape retains reachable controls without overlapping or stretched artwork.
- Pause, report, restart and title do not leave old art over the gameplay or a hidden game without a menu.
- Failure cause and next action stay readable; delay failure never implies mechanical breakdown.
- Standalone HTML includes all new art; published 0.61 remains byte-identical.

### Task 1: Real illustrated title
**Files:** src/title-screen.ts, src/interface-data.ts, tools/build-interface-art.cjs, src/player-experience.ts, index.html; work/check-illustrated-interface.cjs, work/check-047.cjs.
**Interfaces:** consumes TITLE_DATA plus existing GLYPHS; produces mountTitleArt(startButton) and uses current returnToGame handler.
- [ ] Add failing checks for title rendering/integration and unchanged menu controls.
- [ ] Embed selected title and failure atlas via a reproducible script, no network dependencies.
- [ ] Mount the approved title, publisher bitmap and blinking start button; reduce home text, put detailed rules in Commandes.
- [ ] Preserve start button accessible name, keyboard focus, reduced motion and settings/back behavior.
- [ ] Run targeted checks and browser keyboard/pointer/mobile observation.

### Task 2: Illustrated failure and final report
**Files:** src/interface-presentation.ts, src/main.ts, src/player-experience.ts, index.html; work/test-harness.cjs and work/check-illustrated-interface.cjs.
**Interfaces:** consumes FAILURE_DATA, PLAY fail timing, existing FailureReason; produces failureNotice(state) and FailureArt lifecycle.
- [ ] Add failing behavior checks: distinct causes, assignment next vs final report, read-only rendering and visible timing gates.
- [ ] Prepare two fixed frames, show only for breakdown/exhausted after failCardAt; late retains actual scene.
- [ ] Native readable label/cause plate on the quiet right side, continue command below; keep existing sound and cooldown.
- [ ] Give final results a separate paper/stamp presentation, unchanged result/export/restart semantics.
- [ ] Run failure/sequence and full-day tests.

### Task 3: Frame, exports, verification
**Files:** src/presentation.ts, package.json, work/check-illustrated-interface.cjs; generated local day/atelier HTML.
**Interfaces:** drawSurround(g) retains the existing VIEW contract.
- [ ] Assert all frame ink stays outside the gameplay rectangle and HUD, integral and deterministic.
- [ ] Add thin stepped bevel, screws, rust and repair wear without changing viewport or adding per-frame redraws.
- [ ] Run TypeScript/build, npm test, day/navigation/sequence tests and browser screenshots in Chromium/Firefox.
- [ ] Rebuild complete-day and atelier offline launchers; verify native actions and no network/art errors.
- [ ] Fresh review, fix important findings, and deliver exact local path with concise limitations.

## Execution notes
Plan checked against INTENTION; title asset and failure sprite slots share only generated interface-data.ts. No dependencies or imported templates added.

Completed 2026-10-23 in the local atelier branch. All tasks above implemented and
verified. Native title/menu checks pass in Chromium and Firefox, including
portrait/landscape, reduced motion, keyboard and touch emulation. Failure and
both final-report states observed in both browsers. Complete-day tests remain
green at 30/60/120fps. Standalone day opens offline with no script errors;
published Jouer-Technoprof-0.61.html retains SHA-256
05713E027D7DCB4B5CD8AAA6E2E74B53D1EA45526215E33CC8FE4E905B94DD65.

Independent read-only review: no Critical/Important/Minor findings. Physical
phone playtest remains a human validation step. The existing Node experimental
strip-types and Vite single-file chunk-size warnings remain, consistent with
the offline export architecture. No publication or merge performed.

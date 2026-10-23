# Evidence snapshot — gamefeel audit 2026-10-23

Game revision: `6d12ca8`. These files are observations, not balance targets or
human skill measurements. No production configuration is changed by the probes.

From the repository root with the existing Node runtime:

```sh
node work/audits/gamefeel-2026-10-23/reviewer-probes.cjs --days
node work/audits/gamefeel-2026-10-23/road-probes.cjs
node work/audits/gamefeel-2026-10-23/input-probes.cjs
```

Results are written to git-ignored `work/checkpoints/`; the JSON files beside
this README remain the audit's frozen snapshot. Probe setup uses isolated
initial states for input/physics questions and real inputs thereafter. Boss
policies and complete-day pilots use existing scenarios and the current input
pipeline, without correcting health/position/time during the run. They know
routes or follow fixed policies, so they do not model a first human discovery.

- `reviewer-probes.json`: contextual-help results, click/keyboard requests,
  near-landing jump requests, 18 boss-policy tests, six complete days.
- `road-measures.json`: isolated acceleration/braking/inertia/impact recovery,
  plus nine near-pass-then-crash cases from actual held controls.
- `input-crosscheck.json`: independent contact/miss cases for repeated F.
- `day-reference.json`: root's direct-input 60Hz complete-day reference,
  including actual rooms and remaining deadlines.
- `browser-observation.json`: five native workshop scenes inspected. The
  contact/whiff scenes use a historical room to inspect shared animation code;
  they do not cover every actor in the current mission profiles.

No claim of listening, physical-device latency or subjective fun is made by
these automated probes. Full interpretation and proposed work order:
`docs/atelier/AUDIT-GAMEFEEL-2026-10-23.md`.

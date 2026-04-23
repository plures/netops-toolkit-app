## [0.22.0] — 2026-04-23

- feat(lifecycle): milestone-close triggers roadmap-aware release (028db98)

## [0.21.0] — 2026-04-18

- feat(lifecycle v12): auto-release when milestone completes (76c1b5a)

## [0.20.0] — 2026-04-18

- feat: update AppShell sidebar navigation to include all view routes (#49) (e1e42ce)

## [0.19.0] — 2026-04-18

- feat: implement change management flow (plan, push, diff, rollback) across Tauri + Svelte routes (#48) (85b92fe)

## [0.18.0] — 2026-04-18

- feat: align Vault credential deletion with scope/target contract (#47) (43259b4)

## [0.17.0] — 2026-04-18

- feat: add BGP monitoring views with peer health, filters, and session history (#46) (08ea980)

## [0.16.1] — 2026-04-18

- fix: harden ESLint config against missing design-dojo enforce bundle (#45) (93e7658)

## [0.16.0] — 2026-04-18

- feat: add VLAN management view with inventory, consistency checks, and trunk analysis (#43) (82fb1d2)

## [0.15.1] — 2026-04-18

- fix(health): align Tauri health payload casing with UI models and hydrate dashboard on load (#42) (cdde787)

## [0.15.0] — 2026-04-18

- feat(lifecycle v11): smart CI failure handling — infra vs code (b239ce0)

## [0.14.1] — 2026-04-17

- fix(lifecycle): label-based retry counter + CI fix priority (f78a234)

## [0.14.0] — 2026-04-07

- feat: config backup viewer — syntax highlighting and side-by-side diff (#41) (6819f66)

## [0.13.5] — 2026-04-07

- fix: inline reusable workflow to fix schedule trigger failures (e47893d)
- chore: centralize CI to org-wide reusable workflow (dbdd096)
- ci: standardize Node version to lts/* — remove hardcoded versions (2c23c7d)
- ci: centralize lifecycle — event-driven with schedule guard (b21e448)

## [0.13.4] — 2026-04-01

- fix(lifecycle): v9.2 — process all PRs per tick (return→continue), widen bot filter (f812d23)

## [0.13.3] — 2026-04-01

- fix(lifecycle): change return→continue so all PRs process in one tick (c132639)

## [0.13.2] — 2026-03-31

- fix(lifecycle): v9.1 — fix QA dispatch (client_payload as JSON object) (8b51909)

## [0.13.1] — 2026-03-31

- fix(lifecycle): rewrite v9 — apply suggestions, merge, no nudges (b2d8e6f)

## [0.13.0] — 2026-03-29

- feat: Obsidian visual overhaul — SVG icons, dark bg, compact nav (9ae2d61)
- qa: strict CI + store import smoke tests (2debbb1)

## [0.12.8] — 2026-03-29

- fix: effect_orphan crash in PartitionStore + add favicon (4517dd7)

## [0.12.7] — 2026-03-29

- fix: guard against undefined selectedDevice in inventory (44a1c83)

## [0.12.6] — 2026-03-29

- fix: wrap root layout in AppShell for sidebar navigation (2bce31d)

## [0.12.5] — 2026-03-28

- fix: remove stale shell.scope from tauri.conf.json (d69d6a1)

## [0.12.4] — 2026-03-28

- fix: devUrl → port 5173 to match SvelteKit default (eeb136c)

## [0.12.3] — 2026-03-28

- fix: remove setup-python from tauri beforeDevCommand (c2d72d5)

## [0.12.2] — 2026-03-28

- fix: add Deserialize to all structs, fix string escapes, fix borrow checker (e0d9013)

## [0.12.1] — 2026-03-28

- fix: add placeholder icons for Windows build (4f7d3cb)

## [0.12.0] — 2026-03-28

- feat: auto-install netops-toolkit Python backend on build (2f6d1c4)

## [0.11.1] — 2026-03-28

- fix: remove unused externalBin sidecar, use platform-correct python (3936421)
- chore: switch license from AGPL-3.0 to BSL 1.1 (d652539)

## [0.11.0] — 2026-03-28

- feat: add tests (33 passing), admin guide, vitest setup (63b58de)

## [0.10.0] — 2026-03-28

- feat: partition-based licensing system (replaces device-count model) (19311e2)

## [0.9.1] — 2026-03-28

- fix: replace local design-dojo shim with real @plures/design-dojo (4d888c7)

## [0.9.0] — 2026-03-28

- feat: Ansible integration — dynamic inventory export and playbook generation (#33) (b18f175)

## [0.8.2] — 2026-03-28

- fix: add packages:write + id-token:write to release workflow (fa3b1e6)

## [0.8.1] — 2026-03-28

- fix: resolve TypeScript and Svelte 5 errors blocking CI (#32) (b4745d8)

## [0.8.0] — 2026-03-28

- feat: add licensing, YAML settings, export, SSH tunnels, and terminal (ff14ebf)
- docs: add credential vault screenshots (GUI + TUI) (7b204a1)
- docs: add extensive screenshots for all views in GUI and TUI mode (494172d)

## [0.7.0] — 2026-03-28

- feat: Credential Vault UI — encrypted credential management (#31) (3a4df80)
- docs: add ROADMAP.md (8b4244e)
- chore: cleanup and housekeeping (48212c6)
- chore: standardize CI workflow (7057a60)
- chore: standardize lint-clean across org (85afcf4)

## [0.6.0] — 2026-03-27

- feat: health dashboard — fleet-wide CPU, memory, interface errors, log alerts (#30) (baa7d98)

## [0.5.0] — 2026-03-27

- feat: Config backup viewer — collect, diff, and rollback (#29) (63d52cc)

## [0.4.1] — 2026-03-27

- fix: use SplitPane/Pane layout, fix $derived.by, remove dead code in device detail (#28) (d77df8c)

## [0.4.0] — 2026-03-27

- fix: align package version to v0.3.0 to unblock Release workflow (#27) (0760bb3)
- fix: add strict-peer-deps to prevent peer dependency conflicts (#26) (c5d338f)
- feat: Device Detail view — system info, interfaces, health, BGP, config tabs (#24) (5847903)
- docs: add TUI mode screenshot (baeff9a)
- docs: add screenshots for inventory, scan runner, and settings views (64bf9e1)
- [WIP] Add scan runner view with progress tracking (#11) (59a0b57)
- feat: settings view for credentials and scan profiles (#13) (733a82d)
- feat: Inventory Dashboard view with design-dojo Table (#12) (8873844)
- feat: wire netops-toolkit Python CLI as Tauri sidecar (#14) (7904daa)
- feat: app shell with sidebar navigation (#10) (098cd27)

# Changelog

## [0.2.0] — 2026-03-26

- Merge pull request #8 from plures/copilot/bootstrap-svelte-tauri-project (0670611)
- Update src/app.html (9dd362f)
- Update src-tauri/tauri.conf.json (c6dfbed)
- Update src-tauri/Cargo.toml (5296885)
- ci: add standard plures org automation (02cec33)
- feat: bootstrap Svelte 5 + Tauri 2 project from svelte-tauri-template (af629ee)
- Initial plan (d0538d0)
- ci: add GitHub Actions CI and Copilot setup steps (10802f7)
- Initial scaffold: README, package.json (fd78107)


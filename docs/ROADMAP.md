# netops-toolkit-app Roadmap

## Role in OASIS
netops-toolkit-app is the operator console that proves the OASIS stack in the field: a local‑first, privacy‑preserving UI that orchestrates agents (Pares Agens), enforces rules (Praxis), and persists data (PluresDB). It is both a real network ops product and a showcase application for multi‑surface (GUI + TUI) experiences running on the OASIS substrate.

## Current State
The Svelte 5 + Tauri 2 app renders a rich GUI and a TUI mode with documented screens. The Python sidecar is wired, but deep workflows (scan → persist → analyze → diff → policy enforcement) are still shallow. No open issues are currently tracked in this repo.

## Phases

### Phase 0 — Stabilize the shell (Now)
- Harden routing, navigation, and shared view components for GUI/TUI parity.
- Normalize data contracts between the UI and netops-toolkit sidecar.
- Add minimal local persistence (PluresDB) for scan history and configs.

### Phase 1 — OASIS‑aligned operator workflows
- End‑to‑end scan runner: launch → live progress → results ingestion.
- Device detail view with interface health, neighbors, and config snapshot.
- Config history + diff + rollback flows backed by PluresDB.
- Praxis‑enforced safety checks before any change operation.

### Phase 2 — Multi‑agent orchestration
- Pares Agens workflows (backup, compliance check, safe‑push) as first‑class UI actions.
- Agent status dashboard and job queue visualization.
- Local‑first audit trail (Chronos) for every action.

### Phase 3 — Commercial hardening
- Plugin system for vendor packs and custom workflows.
- Offline‑first sync model for multi‑site operators.
- Packaging polish: signed builds, auto‑update, telemetry opt‑in.

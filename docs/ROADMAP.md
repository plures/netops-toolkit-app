# netops-toolkit-app Roadmap

## Role in OASIS
netops-toolkit-app is the operator console that proves the OASIS stack in the field: a local‑first, privacy‑preserving UI that orchestrates agents (Pares Agens), enforces rules (Praxis), and persists data (PluresDB). It is both a real network ops product and a showcase application for multi‑surface (GUI + TUI) experiences running on the OASIS substrate.

## Current State
The app provides one real native workflow: a local OpenSSH SOCKS5 bastion gateway. Python, Ansible, simulated results, and unimplemented device-operation screens have been removed. Future native network workflows will return only as real implementations.

## Phases

### Phase 0 — Stabilize the bastion gateway (Now)
- Add authenticated end-to-end test coverage against a controlled SSH target.
- Extend OpenSSH proxy support with explicit local forwards for applications that cannot use SOCKS5.
- Define durable, user-controlled profile and audit boundaries before adding device workflows.

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

/**
 * Data contracts between the UI and the netops-toolkit sidecar.
 *
 * All communication with the Rust/Python backend uses camelCase JSON
 * serialization (enforced by `#[serde(rename_all = "camelCase")]` on
 * the Rust side). This means TypeScript types can be used directly
 * without manual snake_case → camelCase conversion.
 *
 * Contract categories:
 *   - scan.*     — device discovery events and invoke responses
 *   - health.*   — fleet and device health metrics
 *   - bgp.*     — BGP session data
 *   - config.*  — configuration backup/diff/rollback
 *   - change.*  — change management plan/push/rollback
 *   - vlan.*    — VLAN inventory and consistency
 *   - vault.*   — credential vault operations
 *   - ansible.* — inventory export and playbook generation
 *   - device.*  — device detail queries
 *   - tunnel.*  — SSH tunnel management
 *   - terminal.* — terminal session management
 *   - license.* — license tier and entitlements
 *
 * Wire format rules:
 *   1. All field names are camelCase over the wire.
 *   2. Optional fields are represented as `T | null` (not undefined).
 *   3. Timestamps are ISO 8601 strings (UTC).
 *   4. Enumerations are lowercase string literals.
 *   5. IDs are opaque strings (format determined by backend).
 */

// Re-export all domain types as the canonical contracts.
// Each type file defines both the wire format and UI format (they are identical).
export type {
	Device,
	ScanConfig,
	ScanStatus,
	ScanState,
	ScanSummary,
	DeviceEvent,
	ProgressEvent,
	CompleteEvent,
	ScanErrorEvent,
	ScanEvents
} from '$lib/types.js';

export type {
	DeviceHealthEntry,
	InterfaceErrorEntry,
	LogAlertEntry,
	VendorHealthSummary,
	FleetHealth
} from '$lib/types/health.types.js';

export type {
	BgpSummaryPeer,
	BgpSessionEvent,
	BgpNeighborDetail
} from '$lib/types/bgp.types.js';

export type {
	ConfigBackup,
	DiffResult,
	RollbackResult
} from '$lib/types/config.types.js';

export type {
	ChangePlan,
	ChangeDiffResult,
	ChangePushStep,
	ChangeLogEntry,
	ChangePushResult,
	ChangeRollbackResult
} from '$lib/types/change.types.js';

export type {
	VlanInventoryEntry,
	VlanConsistencyIssue,
	VlanConsistencyReport
} from '$lib/types/vlan.types.js';

export type {
	CredentialScope,
	AuthMethod,
	VaultType,
	VaultCredential,
	VaultSetPayload,
	VaultResolveResult,
	VaultStatus
} from '$lib/types/vault.types.js';

export type {
	InventoryFormat,
	InventoryFilter,
	AnsibleInventory,
	PlaybookTemplate,
	TemplateVariable,
	GeneratedPlaybook,
	ExportResult
} from '$lib/types/ansible.types.js';

export type {
	SystemInfo,
	InterfaceEntry,
	HealthInfo,
	BgpPeer,
	DeviceDetail
} from '$lib/types/device-detail.types.js';

export type {
	TunnelType,
	TunnelStatus,
	TunnelProfile,
	TunnelState,
	TunnelEvent
} from '$lib/types/tunnel.types.js';

export type {
	TerminalType,
	TerminalStatus,
	TerminalTab,
	TerminalShellOption
} from '$lib/types/terminal.types.js';

export type {
	LicenseTier,
	LicensedFeature,
	LicenseInfo
} from '$lib/types/license.types.js';

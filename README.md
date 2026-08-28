# netops-toolkit-app

Native bastion gateway for netops-toolkit, built with Svelte 5 and Tauri 2.

## Current capability boundary

The app does not invoke Python, install Python packages, use Ansible, or present simulated network results.

It provides a real local SOCKS5 proxy through a user-selected bastion using the workstation's OpenSSH client. Profiles contain no password: OpenSSH authentication uses the user's SSH agent or an identity file, and strict host-key checking is always enabled.

Device discovery, SSH automation, configuration collection, vendor command execution, Ansible export, and terminal sessions will return only when implemented as real native capabilities.

The standalone [netops-toolkit](https://github.com/plures/netops-toolkit) Python project remains active and supported for existing Python workflows.

## Architecture transition

The long-term product is a PX-governed Netops operator capability within the
existing Pares Bastion Radix extension, plus a standalone Tauri package built
from the same operator surface and native host-effect boundary. The standalone
package is a workstation distribution of that capability—not a separately
implemented network automation product. See the [Radix extension
architecture](docs/radix-extension-architecture.md) for the capability, data,
Svelte-Ratatui, and Python-retirement gates. None of those future capabilities
are claimed by the current release.

## Development

```bash
npm install
npm run dev
npm run tauri:dev
npm run lint
npm run check
npm test
```

## License

Dual-licensed under [BSL-1.1](LICENSE) and [MIT](LICENSE-MIT). You may choose either license at your option.

# Change Log

All notable changes to the **Portyard** (saptarshiroy39.portyard) extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2026-07-17

### Added

- **Development Build Scripts:** Added helper shell scripts `compile.sh` and `package.sh` under `scripts/` to simplify compiling and packaging the extension.
- **Modular Tunnel Manager:** Created a dedicated `src/tunnelManager.ts` file to isolate SSH tunnel execution logic, state, and target host resolution from VS Code lifecycle events.

### Changed

- **Code Quality Improvements:** Sorted and grouped imports alphabetically across all source files for improved readability.

### Fixed

- **IPv4 Loopback Standardization:** Standardized the target host in SSH forwarding commands to exclusively use the highly optimized IPv4 loopback (`127.0.0.1`) for all loopback and wildcard bindings (including IPv6 `[::1]`, `[::]`, and `::`), while keeping custom non-loopback IPv4 addresses (like `192.168.x.x`). This guarantees maximum loopback forwarding performance and avoids any network routing delays or firewall blocks related to IPv6 on local devices.
- **SSH Connection Speedup:** Added the `-4` flag to the SSH command, forcing IPv4 name resolution. This completely bypasses slow IPv6 handshake attempts and timeouts to `localhost.run` servers, making tunnel generation and loading instantaneous.
- **Robust SSH Output Capturing:** Attached the tunnel URL parser to both `stdout` and `stderr` streams, and refined URL matching logic to filter out the `https://admin.localhost.run` welcome link, ensuring only valid public tunnel URLs (`*.lhr.life` / `*.localhost.run`) are captured.

## [1.2.2] - 2026-07-10

### Fixed

- **IPv6 Loopback Forwarding:** Changed target loopback address in SSH forwarding commands from `127.0.0.1` to `localhost`. This resolves the `ERR_EMPTY_RESPONSE` error when forwarding development servers (like modern Vite or Next.js) that listen exclusively on the IPv6 loopback interface (`[::1]`).

## [1.2.1] - 2026-07-05

### Fixed

- **SSH Tunnel URL Detection:** Restored tunnel URL listener to `stdout` only (reverting the `stderr` listener introduced in 1.2.0), preventing administrative links in the SSH welcome banner from being incorrectly captured as active forwarding URLs.

## [1.2.0] - 2026-06-29

### Added

- **Differentiated Brand Codicons:** Updated tree items to render distinct VS Code Codicons based on technology category (`database` for databases, `server` for runtimes, `globe` for web apps, and `package` for containers).

### Changed

- **Visibility-Aware Polling:** Intelligent scanning engine that automatically pauses background shell execution when the Portyard sidebar panel is collapsed or hidden, saving CPU and battery.
- **Process Mapping Cache:** Implemented a 10-second process caching layer to eliminate redundant process table lookups during port scans.
- **Clean Tooltip Layout:** Streamlined tooltip formatting for a compact, readable presentation.

### Fixed

- **SSH Process Tree Termination:** Enhanced tunnel termination using recursive process tree killing (`taskkill /F /T` on Windows) to guarantee that all background SSH subprocesses and sockets are completely destroyed upon stopping forwarding.
- **SSH Output Stream Parsing:** Attached tunnel URL extraction listeners to both `stdout` and `stderr` streams, preventing URL detection timeouts.

## [1.1.1] - 2026-06-25

### Changed

- **Optimized Auto-Refresh Rate:** Adjusted the auto-refresh interval of active ports list to 5 seconds (previously 30 seconds) for faster UI synchronization.

### Fixed

- **Orphaned SSH Forwarding Tunnels:** Switched the runner from `child_process.exec` to `child_process.spawn` for the SSH forwarder. This ensures the underlying SSH process is completely killed when stopping port forwarding, preventing public URL exposure from persisting.

## [1.1.0] - 2026-06-23

### Added

- **Visual Sharing State:** Port items are now decorated with a brand-colored `broadcast` icon when actively shared/forwarded.
- **One-Click Unsharing:** Added a direct `Stop Forwarding` (circle-slash) inline button on shared port tree items to terminate tunnels with one click.
- **Inline Sharing Utilities:** Added inline actions to quickly `Copy Public URL` and `Open in Browser` for shared ports directly from the sidebar.

## [1.0.0] - 2026-06-12

### Added

- Initial release of the **Portyard** extension.
- **Cross-Platform Port Discovery:** Engine utilizing native `netstat` (Windows) and `lsof` (macOS & Linux) tools.
- **Interactive Sidebar Panel:** Custom Activity Bar view showing the **Active Ports** list.
- **Auto-Refresh:** Automatically scans and refreshes active ports every **30 seconds** to keep status in sync.
- **Fast Process Termination:** "Stop Process" action to release port-hogging sockets instantly.
- **Secure SSH Forwarding:** Instant public tunnel sharing powered by `localhost.run` using safe `StrictHostKeyChecking=accept-new` checking.
- **Quick Endpoints:** Built-in "Open in Browser" action for active `HTTP/HTTPS` servers.
- **Visual Branding:** Tech brand detection with custom color indicators for _Vite_, _Node_, _Python_, _Postgres_, _Redis_, and more.
- **System Port Filtering:** "Eye" toggle to quickly show or hide system and ephemeral ports.

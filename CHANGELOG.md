# Change Log

All notable changes to the **Portyard** (saptarshiroy39.portyard) extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

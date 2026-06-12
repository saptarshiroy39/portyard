# Change Log

All notable changes to the **Portyard** (saptarshiroy39.portyard) extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

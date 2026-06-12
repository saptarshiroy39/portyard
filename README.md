<h1 align="center">
  <img src="./images/logo.png" alt="🔌" width="64">
  <br>
  <b>Portyard</b>
</h1>

<p align="center">
  A <b>VS Code Extension</b> that discovers active local ports and manages running processes directly from a dedicated <b>Activity Bar panel</b>. Running natively on your machine, it discovers open ports and displays their <b>Port Number</b>, <b>PID</b>, <b>Protocol</b>, <b>Process Name</b>, and <b>Technology Brand</b> - all without leaving your editor.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=saptarshiroy39.portyard"><b>🔗 <code>VS Code Marketplace</code></b></a>
  &nbsp;|&nbsp;
  <a href="https://open-vsx.org/extension/saptarshiroy39/portyard"><b>🔗 <code>Open VSX Registry</code></b></a>
  &nbsp;|&nbsp;
  🆔 <code>saptarshiroy39.portyard</code>
</p>

---

## 🎯 _Features_

| FEATURE              | DESCRIPTION                                                                |
| -------------------- | -------------------------------------------------------------------------- |
| **Dedicated View**   | Click the Portyard icon in the Activity Bar to open the active ports panel |
| **Active Port Scan** | Automatically scans active listening ports with their process names & PIDs |
| **System Filter**    | Toggle system and ephemeral ports on/off using the eye filter icon         |
| **Process Control**  | Stop process running on a port with confirmation to free up socket port    |
| **SSH Forwarding**   | Instantly generate safe, public forwarding tunnels via localhost.run       |

---

## 🏗️ _Architecture_

| #   | COMPONENT          | DESCRIPTION                                                     | STACK            |
| --- | ------------------ | --------------------------------------------------------------- | ---------------- |
| 1️⃣  | **Extension Host** | Command registrations, SSH tunnel manager, state, context setup | **_TypeScript_** |
| 2️⃣  | **Ports Provider** | Sidebar tree view data rendering, brand matching, tooltips      | **_TypeScript_** |
| 3️⃣  | **Port Discovery** | Platform-specific shell tools (`netstat`, `lsof`) runner        | **_TypeScript_** |

---

## 📁 _Project Structure_

```
Portyard/
├── .vscode/
│   ├── launch.json         # Extension debug configuration
│   └── tasks.json          # Development compilation tasks
├── .vscodeignore           # Files excluded from published package
├── images/
│   ├── logo.png            # Extension logo/branding
│   └── icon.svg            # Activity Bar icon (sidebar)
├── src/
│   ├── brandUtils.ts       # Visual theme color utilities for technology brands
│   ├── extension.ts        # Main extension entry point & command registration
│   ├── portDiscovery.ts    # Cross-platform port scanning & process mapper
│   └── portTreeProvider.ts # Sidebar ports list Tree View provider
├── eslint.config.js        # ESLint environment configuration
├── LICENSE                 # MIT License details
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── README.md
```

---

<p align="center">
  Made with 🔌 by <a href="https://hirishi.in">Saptarshi Roy</a>
</p>

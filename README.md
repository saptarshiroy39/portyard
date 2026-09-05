<h1 align="center">
  <img src="./images/logo.png" alt="🔌" width="64">
  <br>
  <b>Portyard</b>
</h1>

<p align="center">
  A <b>VS Code Extension</b> that discovers active local ports and manages running processes directly from a dedicated <b>Activity Bar panel</b>. Running natively on your machine, it discovers open ports and displays their <b>Port Number</b>, <b>PID</b>, <b>Protocol</b>, <b>Process Name</b>, and <b>Technology Brand</b> - all without leaving your editor.
</p>

<p align="center">
  <a href="https://github.com/saptarshiroy39/portyard/releases">
    <img alt="GitHub Release" src="https://img.shields.io/github/v/release/saptarshiroy39/portyard?color=emerald">
  </a>
  <a href="https://open-vsx.org/extension/saptarshiroy39/portyard">
    <img alt="Open VSX Downloads" src="https://img.shields.io/open-vsx/dt/saptarshiroy39/portyard?color=goldenrod">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=saptarshiroy39.portyard">
    <img alt="Visual Studio Marketplace" src="https://img.shields.io/badge/get%20it%20on-Visual%20Studio%20Marketplace-royalblue">
  </a>
  <a href="https://open-vsx.org/extension/saptarshiroy39/portyard">
    <img alt="Open VSX Registry" src="https://img.shields.io/badge/get%20it%20on-Open%20VSX%20Registry-darkmagenta">
  </a>
  <a href="https://github.com/saptarshiroy39/portyard/blob/main/LICENSE">
    <img alt="GitHub License" src="https://img.shields.io/github/license/saptarshiroy39/portyard?color=crimson">
  </a>
</p>

---

## ✳️ _Features_

| FEATURE | DESCRIPTION |
| :---: | :---: |
| **Dedicated View** | Click the Portyard icon in the Activity Bar to open the active ports panel |
| **Active Port Scan** | Automatically scans active listening ports with their process names & PIDs |
| **Smart Polling** | Visibility-aware background scanning automatically pauses when panel is hidden |
| **Tech Brand Icons** | Category-based Codicons (`database`, `server`, `globe`, `package`) for tech stack |
| **System Filter** | Toggle system and ephemeral ports on/off using the eye filter icon |
| **Process Control** | Stop process running on a port with confirmation to free up socket port |
| **SSH Forwarding** | Instantly generate safe, public forwarding tunnels via localhost.run |
| **One-Click Actions** | Copy URLs, open in browser, or unshare tunnels with single-click inline buttons |

---

## ✳️ _Architecture_

| # | COMPONENT | DESCRIPTION | STACK |
| :---: | :---: | :---: | :---: |
| 1️⃣ | **Extension Host** | Command registrations, SSH tunnel manager, state, context setup | **_TypeScript_** |
| 2️⃣ | **Ports Provider** | Sidebar tree view data rendering, brand matching, tooltips | **_TypeScript_** |
| 3️⃣ | **Port Discovery** | Platform-specific shell tools (`netstat`, `lsof`) runner | **_TypeScript_** |

---

<p align="center">
  Made with 🔌 by <a href="https://hirishi.in">Saptarshi Roy</a>
</p>

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
| **Dedicated View** | Dedicated Portyard Activity Bar panel for instant access to open ports |
| **Active Port Scan** | Automatically scans active listening ports with their process names & PIDs (`#<pid>`) |
| **Smart Polling** | Visibility-aware background scanning that automatically pauses when panel is hidden |
| **Tech Brand Recognition** | Detects 15+ stacks (React, Vue, Vite, Node, Bun, Django, FastAPI, Postgres, Redis, etc.) with theme colors & Codicons |
| **Persistent SSH Tunnels** | Generates instant, public forwarding URLs (`localhost.run`) with keepalives that survive hot-reloads |
| **System Port Filter** | Toggle system and ephemeral ports on/off using the eye filter icon |
| **Process Control** | One-click process termination with safety confirmation to free up socket ports |
| **One-Click Actions** | Copy public URLs, open endpoints in browser, or unshare tunnels with single-click inline buttons |

---

## ✳️ _Architecture_

| # | COMPONENT | DESCRIPTION | STACK |
| :---: | :---: | :---: | :---: |
| 1️⃣ | **Extension Host** | Lifecycle management, visibility-aware polling loop, command handling | **_TypeScript_** |
| 2️⃣ | **Ports Provider** | Sidebar TreeDataProvider, process item rendering, Markdown tooltips | **_TypeScript_** |
| 3️⃣ | **Port Discovery** | Cross-platform socket scanner (`netstat`, `lsof`), process cache mapping, process killer | **_TypeScript_** |
| 4️⃣ | **Tunnel Manager** | Resilient OpenSSH reverse forwarding runner with chunk buffering & keepalives | **_TypeScript_** |
| 5️⃣ | **Brand Classifier** | Tech stack categorization mapping to VS Code Codicons & chart theme colors | **_TypeScript_** |

---

<p align="center">
  Made with 🔌 by <a href="https://hirishi.in">Saptarshi Roy</a>
</p>

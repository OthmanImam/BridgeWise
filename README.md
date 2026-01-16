# BridgeWise: The Open-Source Multi-Chain UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ecosystem: Stellar](https://img.shields.io/badge/Ecosystem-Stellar/Soroban-purple.svg)](https://stellar.org)

**BridgeWise** is a modular, open-source frontend library designed to solve the fragmented user experience in cross-chain finance. By aggregating routes from major bridges into a single, clean, and embeddable interface, we empower developers to keep users within their dApps while moving assets seamlessly across chains.

---

### 1. Executive Summary
Most bridges force users to leave a dApp to complete a transfer, creating friction, confusion, and security risks. BridgeWise provides a **"One-Click" bridging experience** that developers can drop into any React or Vue application. It aggregates routes from **Stellar/Soroban, LayerZero, and Hop**, ensuring users always find the fastest and cheapest path without leaving your site.

### 2. The Problem
Bridging remains the most dangerous and confusing part of Web3, often serving as a "drop-off" point for users.
* **Fragmentation:** Every bridge has a different UI, leading to a disconnected experience.
* **UI Complexity:** Existing bridge interfaces are often too complex for non-technical users.
* **Lack of Transparency:** Developers lack high-quality, MIT-licensed components that offer real-time fee comparisons across different ecosystems.

### 3. Key Features
* **🚀 Unified Route Discovery:** Automatically compares the fastest and cheapest routes across 10+ chains in real-time.
* **🎨 Plug-and-Play Components:** Modular React and Vue components that can be styled to match any dApp's design system.
* **🌌 Native Stellar Support:** Deep integration with the Stellar/Soroban bridge for low-latency, reliable transfers.
* **💓 Transaction "Heartbeat":** A visual progress tracker that stays active via local state even if the user refreshes their browser.

### 4. Roadmap for this Wave
* **Phase 1:** Complete the Core React Component Library with initial Stellar-to-Ethereum routing.
* **Phase 2:** Launch the "Route Comparison" API to fetch real-time fee data from multiple aggregators.
* **Phase 3:** Establish a "Community Adapter" system where developers can add support for new L2 bridges via PRs.

### 5. Why BridgeWise belongs in Drips Wave
* **Public Good:** The entire UI suite is 100% free and MIT-licensed to help the ecosystem grow.
* **Sustainability:** We use Drips to "pass through" 15% of our funding to the underlying bridge protocols and frontend libraries (like `viem` and `soroban-client`) that we utilize.
* **Ecosystem Growth:** By making bridging easier, we lower the barrier for users to bring liquidity into the Stellar and L2 ecosystems.

---

## 🛠 Project Structure (Monorepo)

```text
BridgeWise/
├── apps/
│   └── docs/          # Interactive documentation & UI Playground
├── libs/
│   ├── bridge-core/   # Core logic for route discovery and API calls
│   └── ui-components/ # The actual React/Vue library components
├── packages/
│   └── adapters/      # Specific logic for Stellar, LayerZero, and Hop
├── .gitignore         # Standard Node.js/Rust exclusions
└── LICENSE            # MIT Licensed

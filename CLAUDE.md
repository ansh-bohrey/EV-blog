# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

A content planning repository for a technical blog about EV Battery Management Systems (BMS). There is no code, build system, or test suite — all files are Markdown.

## Repository Structure

- `topics.md` — master index of all planned and completed blog topics
- `topics/` — one `.md` file per topic; contains the blog plan, not the final post

## Topic File Convention

Every plan file in `topics/` follows this exact structure:

1. **Goal** — one sentence stating what the post achieves
2. **Audience Angles** — separate framing for Engineers/students vs EV enthusiasts
3. **Subtopic Flow** — numbered sections building from a simple hook to intermediate depth
4. **Experiment Ideas** — 2–3 hands-on experiments with Materials, Procedure, and "What to observe"
5. **Literature Review** — split into: Core Textbooks, Key Papers, Online Resources, Standards/App Notes

Standards posts (AIS-156, AIS-004, ISO-26262, ISO-13849) use a simpler format with just `Status: Done`.

## Intended Audience

Three simultaneous audiences for every post:
- **Engineers** — comfortable with math, circuit diagrams, register-level details
- **Engineering students** — need intuition built before formulas
- **EV enthusiasts** — frame everything around "why does my car do X?"

The tone is: relatable hook → physical intuition → intermediate technical depth. Never PhD-level derivations, never dumbed-down either.

## Experiment Hardware Kit

Experiments across all posts are designed around a consistent, low-cost hardware set so readers can follow along across the series:
- Arduino Uno/Nano + INA219 (current/voltage logging)
- 18650 Li-ion cells (both NMC and LFP where chemistry comparison matters)
- NTC thermistors
- MCP2515 CAN shield (used in CAN bus and communication posts)
- MAX485 module (used in RS-485 post)
- TI BQ76940EVM or BQ76920 breakout (used in AFE post)

## Cross-Topic Links

Posts are intentionally cross-referenced. The recommended reading dependency order:

```
OCV vs Terminal Voltage
        ↓
SOC  ←──────→  SOH
        ↓           ↓
       SOP    Deep Discharge Protection
        ↓
Cell Balancing ←── AFE
        ↓
Charging Algorithm
        ↓
Ignition Handling ──→ Post-PDU Paralleling
        ↓
Communication Interface (overview)
├── CAN (deep dive)
└── RS-485/232 (deep dive)
        ↓
Error Handling / Fault Reporting
        ↓
Thermal Runaway Detection
```

When adding new posts or editing existing ones, check these dependencies — a new post on a topic should link to its prerequisites and be linked from posts that depend on it.

## Adding a New Topic

1. Add the topic name to `topics.md` under the appropriate section
2. Create `topics/<slug>.md` following the five-section structure above
3. Note whether it is a standalone post or a deep-dive on something already touched in `communication-interface.md` (like `can.md` and `rs-485-232.md` are)

## Key Recurring Literature References

These appear across multiple posts — use consistently:
- Plett, G.L. — *Battery Management Systems* Vol. 1 & 2 (Artech House, 2015)
- Andrea, D. — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010)
- Severson et al. (2019) — *Nature Energy* — cycle life prediction from early-cycle data
- Attia et al. (2020) — *Nature* — fast charging optimization
- Battery University (batteryuniversity.com) — accessible reference for enthusiast-facing content
- Orion BMS User Manual — real-world BMS implementation reference (publicly available)

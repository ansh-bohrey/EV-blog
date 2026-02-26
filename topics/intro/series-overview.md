# Series Overview — How to Read This Blog

## Goal
Give every reader — student, enthusiast, or engineer — a clear map of the series so they know where to start, what each section covers, and how the posts connect to each other.

## Audience Angles
- **Engineers / students**: Reading order that builds mathematical and systems understanding progressively; which posts have experimental depth worth pursuing
- **EV enthusiasts**: The fastest path to the posts that answer everyday EV questions without needing to read the full series

---

## Subtopic Flow

### 1. What This Blog Is (and Isn't)
- This is a technical blog about how EV batteries work — from the cell chemistry up to the full vehicle
- It is not a buying guide, not a range comparison, not a review site
- The goal: by the end, a reader can open a BMS datasheet or CAN log and understand what they are looking at
- Posts are structured to serve three audiences simultaneously — each section flags which parts go deep and which stay accessible

### 2. Who This Is For
Define the three audiences clearly and honestly:
- **Engineering students (2nd–4th year EE/ME/ECE)**: You have circuit theory and some coding. You want to understand what BMS engineers actually do. This series builds from cell physics through algorithm design to embedded systems.
- **EV enthusiasts**: You own or want an EV. You've read specs but want to understand the engineering behind range, charging, degradation, and warnings. Start with the "EV Experience" path below.
- **Practicing engineers**: You work in automotive or energy and want a reference for topics adjacent to your specialty. Use the section index below to jump to what's relevant.

### 3. What You Need to Know Before Starting
Keep this short and honest:
- **For students**: Ohm's law, basic RC circuits, and how a voltage divider works. If you know these, every post is accessible. Calculus appears in SOC and SOP posts but is explained in context.
- **For enthusiasts**: Nothing required. Every post starts with an intuition-first hook. Skip any section that gets too technical — the takeaways are always in plain English.
- **For engineers**: The ECM primer is worth reading even if you know the basics — it establishes the notation used throughout the series.

### 4. The Series Map — Sections and What They Cover

**Overview (start here)**
- *Series Overview* (this post) — reading guide
- *Equivalent Circuit Model Primer* — the Thevenin model that underpins SOC, SOP, and OCV posts. Read before touching anything in BMS Concepts.

**Battery — The Hardware Foundation**
- *Cell* — chemistry, formats, datasheets. The vocabulary of everything else.
- *Battery (Pack / Module)* — how cells become a pack. Series/parallel, xSyP, pack hierarchy.
- *Cooling* — why temperature is the master variable; how EVs manage it.

**BMS Concepts — The Intelligence Layer**
Posts in recommended reading order:
1. OCV vs Terminal Voltage — the voltage gap that every other post references
2. State of Charge (SOC) — the fuel gauge problem and how it's solved
3. State of Health (SOH) — how batteries age and how the BMS tracks it
4. State of Power (SOP) — why you can't always floor it
5. Cell Balancing — why packs go out of balance and how the BMS corrects it
6. Analog Front End (AFE) — the hardware that measures every cell
7. Deep Discharge Protection — what happens below the minimum voltage
8. Thermal Runaway Detection — the last line of safety
9. Charging Algorithm — CC-CV and beyond
10. Error Handling / Fault Reporting — how the BMS communicates failures
11. Ignition Handling — how the BMS powers up and shuts down safely
12. HV Safety Architecture — the complete safety circuit from contactors to crash fuse
13. Post-PDU Paralleling — connecting multiple packs
14. BMS During a Drive — a narrative tying it all together
15. BMS Validation — how BMS software is tested before going into a vehicle

**Interfaces — How Everything Communicates**
- *Communication Interface* — overview of all protocols used in a BMS
- *CAN Bus* — deep dive; the vehicle backbone
- *RS-485 / RS-232* — deep dive; industrial and debug communication

**EV — The Vehicle Context**
- *EV Nodes* — every ECU in a BEV and how they connect
- *Why Range Drops in Winter* — combines SOP, SOC, and thermal into one answer

**Standards**
- AIS 156, AIS 004, ISO 26262, ISO 13849 — Indian and international regulatory context

### 5. Three Suggested Reading Paths

**Path A — "I want to understand my EV"** (enthusiast, ~6 posts)
1. Cell — understand what's in your battery
2. Battery (Pack) — understand the pack
3. Cooling — understand winter range and fast charging
4. BMS During a Drive — see how it all works together while driving
5. Why Range Drops in Winter — the direct answer to a common question
6. Charging Algorithm — understand fast charging and why it slows at 80%

**Path B — "I'm a student building EV knowledge"** (student, read in order)
1. Cell → Battery (Pack) → Cooling (hardware foundation)
2. ECM Primer (essential before BMS Concepts)
3. OCV vs Terminal Voltage → SOC → SOH → SOP (estimation stack)
4. AFE → Cell Balancing (measurement and balancing hardware)
5. Ignition Handling → HV Safety Architecture (system safety)
6. CAN Bus → EV Nodes (communication and vehicle integration)

**Path C — "I need a reference on a specific topic"** (engineer)
Use the Topic Review table in topics.md to jump directly to the relevant post. Each post has a Literature Review section pointing to the key papers and standards.

### 6. How Each Post is Structured
Every post follows the same format so you always know where to find things:
- **Goal** — one sentence on what the post achieves
- **Audience Angles** — how the depth differs for engineers vs enthusiasts
- **Subtopic Flow** — the post's section-by-section plan, simple to intermediate
- **Experiment Ideas** — 2–3 hands-on experiments with common hardware (Arduino, 18650 cells, INA219)
- **Literature Review** — textbooks, papers, online resources, standards/app notes

The Experiments section uses a consistent hardware kit across the series — see the hardware list in CLAUDE.md.

### 7. A Note on Depth
Some posts go deep — the SOC post covers the Extended Kalman Filter; the CAN post covers bit stuffing and error frames. These sections are intentional: the goal is intermediate depth, not beginner-only content.

If a section loses you, the Takeaways at the end of each post always give you the plain-English version. You can come back to the technical depth when you're ready.

---

## No Experiment (This is a Navigation Post)

This post does not have experiments — it is a series guide. Refer to the individual topic posts for hands-on content.

---

## Literature Review

### For Getting Started
- Battery University (batteryuniversity.com) — free, accessible, well-organized reference for all battery topics
- **Plett, G.L.** — *Battery Management Systems, Vol. 1* — if you want to go deeper than this blog, this is the next step for the BMS estimation side
- **Warner, J.T.** — *The Handbook of Lithium-Ion Battery Pack Design* — for the hardware and pack engineering side

### On Learning Paths
- TI University Program — free courses on battery management ICs (registration required)
- Coursera / edX — "Electric Vehicles and Mobility" (various universities) — good background for enthusiasts
- MIT OpenCourseWare 6.622 — Power Electronics — if you want to understand the inverter/motor side that this series deliberately does not cover

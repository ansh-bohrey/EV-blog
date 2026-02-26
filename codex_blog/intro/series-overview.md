# Series Overview — How to Read This Blog

---

## What This Blog Is (and Isn’t)

This is a technical blog about EV batteries and BMS systems — from cell chemistry to pack design to algorithms. It is not a buying guide or EV review site. The goal is that by the end, you can open a BMS datasheet or CAN log and understand what you’re looking at.

---

## Who This Is For

- **Engineering students**: want the real engineering story, from cells to algorithms
- **EV enthusiasts**: want to understand range, charging, and degradation in plain language
- **Practicing engineers**: want a focused reference for adjacent systems

No special background is required beyond basic Ohm’s law and RC intuition.

---

## The Series Map

**Overview**
- Series Overview (this post)
- Equivalent Circuit Model (ECM) Primer

**Battery (Hardware Foundation)**
- Cell
- Battery Pack / Module Architecture
- Cooling / Thermal Management

**BMS Concepts (Recommended Order)**
1. OCV vs Terminal Voltage
2. SOC
3. SOH
4. SOP
5. Cell Balancing
6. AFE
7. Deep Discharge Protection
8. Thermal Runaway Detection
9. Charging Algorithm
10. Error Handling / Fault Reporting
11. Ignition Handling
12. HV Safety Architecture
13. Post-PDU Paralleling
14. BMS During a Drive
15. BMS Validation

**Interfaces**
- Communication Interface (overview)
- CAN
- RS-485/232

**EV Context**
- EV Nodes / ECU architecture
- Why Range Drops in Winter

**Standards**
- AIS 156, AIS 004, ISO 26262, ISO 13849

---

## Suggested Reading Paths

**Path A — Understand your EV (short path)**
1. Cell
2. Battery Pack
3. Cooling
4. Charging Algorithm
5. BMS During a Drive

**Path B — Student / engineer (full path)**
1. Cell → Battery → Cooling
2. ECM Primer
3. OCV → SOC → SOH → SOP
4. AFE → Cell Balancing
5. Ignition Handling → HV Safety
6. CAN → EV Nodes

**Path C — Reference**
Jump to the specific topic you need; each post includes a literature review.

---

## Post Structure

Each post follows the same pattern:

- Core explanation (intuition → technical depth)
- Experiments (hands-on where possible)
- Literature review (papers, standards, app notes)

---

## Literature Review

### Good Starting Points
- Battery University (batteryuniversity.com)
- Plett — *Battery Management Systems Vol. 1*
- Warner — *Handbook of Lithium-Ion Battery Pack Design*

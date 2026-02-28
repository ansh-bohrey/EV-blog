# Topics
## Overview
- Series roadmap — how to read this blog, reading order, audience guide
- Equivalent Circuit Model (ECM) primer — R0, RC pairs, Thevenin model (foundation for SOC/SOP/OCV posts)

## Battery
- cell - chemistry, types, voltage range etc
- battery - cells in series, parallel; battery in series parallel etc
- cooling - passive, active etc

## BMS Concepts
- BMS Introduction — what a BMS is, its core functions, physical placement, and architectural variants
- State of Charge (SOC)
- State of Health (SOH)
- State of Power (SOP)
- Error handling / fault reporting
- Ignition handling
- Cell balancing
- Analog Front End (AFE)
- Thermal runaway detection / handling
- Deep discharge protection
- Open Circuit Voltage (OCV) vs Terminal Voltage logic
- Charging algorithm (To Do)
- Post-PDU paralleling (To Do)
- HV Safety Architecture — contactors, HVIL, isolation monitoring, MSD, crash fuse as one unified post
- BMS during a drive — narrative walkthrough tying all BMS functions together
- BMS Validation — HIL, SiL, DFMEA-linked test cases, from bench to vehicle

## Interfaces
- Communication interface
- CAN
- RS-485/RS-232

## EV
- nodes - VCU, cluster, IOT, IMD, MCU (motor controller) etc
- Why range drops in winter — SOP + SOC + heating energy cost combined

## Standards
- AIS 156 
- AIS 004 
- ISO 26262 
- ISO 13849 

## Topic Review
| Topic | File | Status | Notes |
| --- | --- | --- | --- |
| Series Overview | `topics/intro/series-overview.md` | Plan | Full blog plan outline |
| ECM Primer | `topics/intro/equivalent-circuit-model.md` | Plan | Full blog plan outline |
| Cell | `topics/battery/cell.md` | Plan | Full blog plan outline |
| Battery (pack/module) | `topics/battery/battery.md` | Plan | Full blog plan outline |
| Cooling / Thermal management | `topics/battery/cooling.md` | Plan | Full blog plan outline |
| EV Nodes | `topics/ev/ev-nodes.md` | Plan | Full blog plan outline |
| Why range drops in winter | `topics/ev/why-range-drops-in-winter.md` | Plan | Full blog plan outline |
| HV Safety Architecture | `topics/bms_concepts/hv-safety-architecture.md` | Plan | Full blog plan outline |
| BMS during a drive | `topics/bms_concepts/bms-during-a-drive.md` | Plan | Full blog plan outline |
| BMS Validation | `topics/bms_concepts/bms-validation.md` | Plan | Full blog plan outline |
| AIS 004 | `topics/standards/AIS-004_standard.md` | Done | Status marker only |
| AIS 156 | `topics/standards/AIS-156_standard.md` | Done | Status marker only |
| ISO 13849 | `topics/standards/ISO-13849_standard.md` | Done | Status marker only |
| ISO 26262 | `topics/standards/ISO-26262_standard.md` | Done | Status marker only |
| BMS Introduction | `topics/bms_concepts/bms-introduction.md` | Plan | Full blog plan outline |
| Analog Front End (AFE) | `topics/bms_concepts/analog-front-end-afe.md` | Plan | Full blog plan outline |
| CAN | `topics/interfaces/can.md` | Plan | Full blog plan outline |
| Cell balancing | `topics/bms_concepts/cell-balancing.md` | Plan | Full blog plan outline |
| Charging algorithm | `topics/bms_concepts/charging-algorithm.md` | Plan | Full blog plan outline (tagged To Do above) |
| Communication interface | `topics/interfaces/communication-interface.md` | Plan | Full blog plan outline |
| Deep discharge protection | `topics/bms_concepts/deep-discharge-protection.md` | Plan | Full blog plan outline |
| Error handling / fault reporting | `topics/bms_concepts/error-handling-fault-reporting.md` | Plan | Full blog plan outline |
| Ignition handling | `topics/bms_concepts/ignition-handling.md` | Plan | Full blog plan outline |
| OCV vs terminal voltage | `topics/bms_concepts/open-circuit-voltage-ocv-vs-terminal-voltage-logic.md` | Plan | Full blog plan outline |
| Post-PDU paralleling | `topics/bms_concepts/post-pdu-paralleling.md` | Plan | Full blog plan outline (tagged To Do above) |
| RS-485 / RS-232 | `topics/interfaces/rs-485-232.md` | Plan | Full blog plan outline |
| SOC | `topics/bms_concepts/state-of-charge-soc.md` | Plan | Full blog plan outline |
| SOH | `topics/bms_concepts/state-of-health-soh.md` | Plan | Full blog plan outline |
| SOP | `topics/bms_concepts/state-of-power-sop.md` | Plan | Full blog plan outline |
| Thermal runaway | `topics/bms_concepts/thermal-runaway-detection-handling.md` | Plan | Full blog plan outline |

## Literature Review
**BMS Fundamentals**
- Gregory L. Plett, *Battery Management Systems, Vol. 1: Battery Modeling* (Artech House) — foundational modeling and estimation text. citeturn0search7
- Davide Andrea, *Battery Management Systems for Large Lithium-Ion Battery Packs* (Artech House) — practical BMS architecture and implementation. citeturn0search1

**SOC/SOH/SOP, Power Limits, Characterization**
- USABC Electric Vehicle Battery Test Procedures Manual (USDOE/OSTI) — standard characterization methods including pulse power testing. citeturn0search2
- IEC 62660-1:2018 — performance testing for Li‑ion cells for EV propulsion (capacity, power, energy, cycle life). citeturn0search0

**AFE / Measurement Hardware**
- TI BQ76940 product page and datasheet — representative automotive/LEV AFE features and interface details. citeturn1search2
- Analog Devices LTC6811-1 product page — multicell monitor with isoSPI daisy chain (pack‑scale measurement). citeturn1search0

**Thermal Runaway / Abuse / Safety Testing**
- UL 9540A test method overview — thermal runaway fire propagation testing for battery energy storage systems. citeturn2search2
- FreedomCAR/Sandia abuse test manual — standardized abuse testing for EV/HEV energy storage. citeturn1search1
- IEC 62619 safety standard for industrial Li‑ion batteries (cell/module/system safety requirements). citeturn4search0

**CAN / Vehicle Networks**
- ISO 11898-1:2024 — CAN data link layer and physical coding sublayer standard. citeturn2search1

**RS‑485 / RS‑232**
- Analog Devices AN‑960 — practical RS‑485/RS‑422 design guidance and implementation details. citeturn2search0
- TI RS‑232 overview page (includes glossary/selection guide resource). citeturn4search4

**Functional Safety**
- ISO 26262‑1:2018 — functional safety framework for road vehicles. citeturn3search3
- ISO 13849‑1:2023 — safety‑related control systems for machinery (design principles). citeturn3search0

**Indian Standards (AIS)**
- MoRTH notification S.O. 4143(E) — implementation notice for AIS‑156. citeturn5search44
- ARAI AIS standards index — official listing of AIS standards. citeturn5search5
- Draft AIS‑004 Part 3 EMC document (ARAI). citeturn5search43








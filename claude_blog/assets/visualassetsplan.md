# Visual Assets Plan — EV BMS Blog Series

## Type Key

| Tag | Meaning |
|---|---|
| `[ANIM]` | Interactive animation, coded (D3.js / p5.js / Plotly) |
| `[CHART]` | Data chart/graph (from experiment, simulation, or published data) |
| `[DIAG]` | Diagram (circuit, block, flow — draw.io / SVG / Excalidraw) |
| `[TABLE]` | Table worth rendering as a styled visual graphic |
| `[PUB]` | Grab from a paper or OEM documentation (with citation) |

---

## Top Priority — Must-Have Visuals

These appear across multiple posts, are the conceptual backbone of the series, or are explicitly called out in the topic plans:

| # | Visual | Posts That Use It | Type |
|---|---|---|---|
| 1 | OCV-SOC curves (NMC vs LFP) — one canonical chart reused everywhere | Cell, OCV, SOC, SOH | `[CHART]` |
| 2 | ECM voltage waveform animation (step current → R₀ drop → RC drop → recovery) | ECM Primer, OCV, SOC, SOP | `[ANIM]` |
| 3 | BMS state machine diagram (Sleep → Standby → Pre-charge → Active → Charge → Fault) | Ignition Handling, BMS During a Drive | `[DIAG]` |
| 4 | Full EV node map (VCU, BMS, MCU, OBC, DCDC, TMC, Gateway, etc.) | EV Nodes, CAN, BMS During a Drive | `[DIAG]` |
| 5 | CC-CV charge profile animation (V and I vs time) | Charging Algorithm, BMS During a Drive | `[ANIM]` |
| 6 | Degradation mechanisms cell cross-section (SEI, plating, cracking, electrolyte decomp) | SOH (explicitly called out in plan) | `[DIAG]` |
| 7 | Thermal runaway temperature cascade (reaction stages with onset temperatures) | Thermal Runaway | `[DIAG]` |
| 8 | Six-layer HV safety stack (contactors → pre-charge → HVIL → IMD → MSD → crash fuse) | HV Safety Architecture | `[DIAG]` |
| 9 | Annotated drive timeline chart (SOC, current, temp, max power vs time with event markers) | BMS During a Drive | `[CHART]` |
| 10 | V-model diagram (left arm: requirements → code; right arm: unit test → vehicle) | BMS Validation | `[DIAG]` |

---

## Full Visual Inventory by Post

---

### Intro

#### Series Overview

- `[DIAG]` Reading dependency tree (the CLAUDE.md dependency order rendered as an actual linked tree graphic)
- `[DIAG]` Three reading paths (A/B/C) as a visual flowchart with color-coded tracks per audience

#### ECM Primer

- `[DIAG]` Progressive circuit build-up — Level 0 (source only) → Level 1 (+R₀) → Level 2 (+1RC) → Level 3 (+2RC), four side-by-side circuits
- `[ANIM]` Step current in → instant voltage drop (R₀) → slow RC drop → current off → instant recovery → slow exponential recovery toward OCV. The signature ECM waveform referenced throughout the series.
- `[CHART]` Simulated vs measured V_terminal overlay (Python simulation output from Experiment 3)
- `[DIAG]` HPPC pulse parameter extraction: annotated voltage waveform showing where R₀, τ₁, τ₂ are read off

---

### Battery

#### Cell

- `[DIAG]` Cross-section of a Li-ion cell: anode, separator, cathode, electrolyte, current collectors — labeled schematic
- `[ANIM]` Intercalation animation: Li⁺ ions moving into graphite layers during charge, reversing on discharge
- `[CHART]` OCV-SOC curves: NMC vs LFP on the same graph — flat LFP plateau vs sloped NMC curve. **Canonical chart for the series — reused in SOC, SOH, OCV posts.**
- `[TABLE]` Chemistry comparison table (LCO / NMC 532 / NMC 811 / NCA / LFP / LTO) — color-coded visual render
- `[DIAG]` Cell format comparison: 18650, 21700, 4680, prismatic, pouch, blade — to-scale silhouettes with dimensions labeled
- `[CHART]` C-rate vs delivered capacity (capacity drops at 2C vs C/5) — from experiment data or published datasheets
- `[DIAG]` SEI formation during first charge: anode + electrolyte + growing SEI layer, simple schematic

#### Battery (Pack / Module)

- `[DIAG]` Series vs parallel cell connection — voltage adds in series, capacity adds in parallel, with clear labeling
- `[DIAG]` xSyP notation: 96S3P example with actual cell grid, labeled with voltage and capacity math
- `[DIAG]` Pack hierarchy: cell → module → pack → CTP, with component callouts (contactors, MSD, cooling plate, BMS PCB)
- `[DIAG]` HV isolation and MSD: mid-pack break creating two sub-60V sections per ECE R100
- `[CHART]` 400V vs 800V architecture: for a given power, show cable current — visual case for 800V
- `[ANIM]` Interactive 96S3P worked example: sliders for N_series and N_parallel, live-updating pack voltage / capacity / energy / resistance

#### Cooling

- `[CHART]` Temperature vs aging rate: 2× per 10°C rule plotted as a curve — from `[PUB]` Waldmann et al. 2014 or generated
- `[DIAG]` Thermal resistance network: cell → TIM → cooling plate → coolant, with R_thermal values at each node
- `[DIAG]` Serpentine cooling channel plate top-view: annotated with inlet/outlet, showing ΔT gradient along flow
- `[CHART]` I²R heat generation vs C-rate: P = I²R quadratic curve — doubling C-rate → 4× heat
- `[TABLE]` Production vehicle cooling comparison (Leaf / Tesla / Bolt / BMW i3 / Ioniq 5 / CATL Blade) — styled visual
- `[DIAG]` Heat pump vs PTC heater: COP comparison diagram
- `[CHART]` Temperature gradient across pack under load — from Experiment 2 data, shown as heatmap bar across cells

---

### BMS Concepts

#### OCV vs Terminal Voltage

- `[ANIM]` **Core series animation**: interactive current slider — change discharge current, terminal voltage drops below OCV in real time. IR drop = I × R. Labels update live.
- `[DIAG]` Thevenin ECM circuit: OCV source + R₀ + RC pairs, labeled
- `[CHART]` Voltage relaxation curve: multi-exponential recovery after load removed — NMC vs LFP (LFP much slower). From Experiment 2.
- `[CHART]` LFP OCV hysteresis: charge OCV vs discharge OCV on same graph — the ~5–20mV gap. From Experiment 3 or `[PUB]` Safari & Delacourt 2011.
- `[DIAG]` BMS decision tree: when is it reading OCV vs terminal voltage, and what does it do with each

#### State of Charge (SOC)

- `[CHART]` OCV-SOC curves NMC vs LFP (reuse canonical chart from Cell post)
- `[ANIM]` Coulomb counting drift: animated SOC meter drifting away from true SOC over cycles due to sensor offset, snapping back at full charge anchor point
- `[DIAG]` EKF GPS analogy: dead reckoning (Coulomb counting) + landmark fix (OCV lookup) = corrected estimate
- `[CHART]` Temperature effect on OCV: same cell OCV at 5°C vs 25°C vs 45°C — naive voltage lookup gives wrong SOC when cold
- `[DIAG]` SOC estimation algorithm flowchart: current + voltage + temp → Coulomb counting → model-based correction → SOC output

#### State of Health (SOH)

- `[DIAG]` Degradation mechanisms: cell cross-section annotated with SEI growth (anode), lithium plating (anode surface), particle cracking, electrolyte decomposition (cathode). **Explicitly called out in the plan.**
- `[CHART]` Capacity fade curve vs cycle number — from `[PUB]` Severson et al. 2019 Nature Energy, or from Experiment 1 data
- `[TABLE]` Aging stress factors table (temperature / SOC / charge rate / DoD / low-temp charging) — styled visual
- `[CHART]` ICA (dQ/dV) plot: fresh cell vs aged cell — peaks shift and shrink. From Experiment 3 data or `[PUB]` Dubarry et al.
- `[DIAG]` SOH estimation methods comparison: full capacity test vs ICA vs EIS vs model-based vs data-driven

#### State of Power (SOP)

- `[DIAG]` HPPC pulse test waveform: 10s discharge pulse, 40s rest, 10s regen pulse — annotated with where R₀ and voltage headroom are read
- `[CHART]` R_internal vs temperature: Arrhenius-like curve, 0°C to 45°C — basis for cold-weather SOP derating. From Experiment 1.
- `[CHART]` SOP vs SOC at multiple temperatures (three curves: −10°C, 25°C, 45°C) — the HPPC-derived lookup table visualized
- `[ANIM]` Derating visualization: animated power gauge that drops as temperature slider goes cold or SOC approaches extremes
- `[DIAG]` SOP calculation annotated on a V-I characteristic: SOP_discharge = (OCV − V_min) / R_total

#### Cell Balancing

- `[DIAG]` Series string with one weak cell: bucket chain analogy — cell voltage bars showing how the smallest limits total capacity
- `[DIAG]` Passive balancing circuit schematic: shunt resistor + MOSFET per cell, 4-cell example
- `[DIAG]` Active balancing topologies: capacitor shuttling and inductor-based — side by side with energy path shown
- `[ANIM]` Cell voltage convergence: bar chart of 4 cell voltages where the high cell slowly bleeds down to match others over time
- `[CHART]` Pack capacity before vs after balancing — bar chart of recovered Ah (from Experiment 3)
- `[DIAG]` Top balancing vs bottom balancing: what each optimizes, use case comparison

#### Analog Front End (AFE)

- `[DIAG]` Block diagram: cells → AFE chip → SPI → BMS MCU → CAN → VCU
- `[DIAG]` Differential measurement: cell 10 sitting at 36V above ground, AFE measures V+ minus V- locally
- `[DIAG]` Delta-sigma ADC architecture: simplified block showing oversampling and decimation filter
- `[DIAG]` isoSPI daisy-chain: 6× LTC6804 modules at different HV potentials, pulse transformers between each, MCU at the end
- `[DIAG]` SPI read transaction timing: CS low → command byte → data bytes → CRC → CS high, annotated
- `[DIAG]` BQ76940 register map overview: configuration, status, and data register categories schematically

#### Thermal Runaway Detection / Handling

- `[DIAG]` Reaction cascade: vertical temperature axis with each reaction stage labeled at its onset temperature — SEI decomp (80°C), anode/electrolyte (100–130°C), separator melt (130–150°C), cathode decomp (150–200°C), electrolyte combustion (>200°C). Color-coded red gradient.
- `[CHART]` ARC curve example: heat-wait-seek phases with self-heating onset — from `[PUB]` Golubkov et al. 2014 or NREL abuse test reports
- `[DIAG]` Stage 0→1→2→3 detection window: timeline showing BMS response window vs runaway progression rate
- `[TABLE]` Chemistry thermal safety comparison (LCO / NMC 811 / NMC 532 / LFP / LTO) — color-coded visual
- `[DIAG]` BMS response flowchart: Stage 1 warning actions vs Stage 2 shutdown actions

#### Deep Discharge Protection

- `[ANIM]` Copper dissolution: below 2V, Cu foil oxidizes → Cu²⁺ ions enter electrolyte → replate as dendrites on recharge → potential internal short
- `[CHART]` Self-discharge curve: OCV vs time over 8 weeks at room temperature — from Experiment 2 data
- `[DIAG]` Recovery pre-charge protocol flowchart: C/20 → wait for 3V → normal CC-CV, with branch if cell doesn't recover
- `[CHART]` Voltage dynamics during recovery charge: V_terminal vs time at C/20, showing the slow voltage climb from deep-discharged state

#### Error Handling / Fault Reporting

- `[DIAG]` Fault taxonomy tree: cell-level (OV/UV/OCD/OCC/OT/UTC) → system-level (comms/contactor/sensor/memory) → insulation/safety (isolation/HVIL)
- `[ANIM]` Debounce timing diagram: threshold crossing with debounce counter — transient that doesn't latch vs sustained fault that does
- `[DIAG]` Fault severity levels flowchart: Warning (Level 1) → Fault (Level 2) → Critical/Shutdown (Level 3) with actions at each
- `[TABLE]` DTC structure: fault code ID, description, severity, occurrence count, clear condition — styled table
- `[DIAG]` CAN fault bitmask: one byte shown bit-by-bit with each bit labeled to a fault type

#### Ignition Handling

- `[DIAG]` **BMS state machine**: Sleep → Standby → Pre-charge → Active/Run → Charge → Fault — transitions and conditions labeled. Explicitly called out in the plan as "the most valuable visual for this post."
- `[ANIM]` Pre-charge RC curve: capacitor voltage rising exponentially through resistor, with RC time constant math overlay
- `[DIAG]` Contactor sequencing timing diagram: main neg closes → pre-charge closes (with resistor) → main pos closes → pre-charge opens, with HV bus voltage at each step
- `[DIAG]` HVIL loop: low-voltage continuity loop through every HV connector, with illustration of what happens when one connector is pulled

#### HV Safety Architecture

- `[DIAG]` Six-layer defense stack: battery → contactor system → pre-charge → HVIL → isolation monitoring → MSD → pyrotechnic fuse — each layer labeled with the failure mode it catches
- `[DIAG]` Complete HV circuit diagram: pack terminals through all six layers to motor controller — the full picture in one diagram
- `[DIAG]` Isolation monitoring principle: floating HV bus, IMD AC signal injection, fault current path when insulation degrades
- `[DIAG]` Contact weld detection: load-side voltage present when contactor commanded open → weld fault flag
- `[DIAG]` Fault scenario storyboard: coolant leak → IMD warning → driver notified → resistance drops further → contactors open → safe state
- `[ANIM]` Isolation resistance degradation: slider from healthy (500 MΩ) to fault (<50 kΩ), with implied leakage current at 400V and hazard level updating

#### Battery Paralleling

- `[DIAG]` Two-pack HV bus diagram: Pack 1 and Pack 2 each with individual contactors and pre-charge paths, meeting at a common bus
- `[ANIM]` Inrush current waveform: without pre-charge (spike) vs with pre-charge (smooth exponential) — side-by-side current waveforms
- `[DIAG]` Parallel contactor sequencing timing diagram: step-by-step sequence to add Pack 2 to an active bus
- `[DIAG]` Master BMS + Pack BMS architecture: CAN bus connecting master to each pack BMS, with responsibilities labeled

#### BMS During a Drive

- `[CHART]` **Annotated drive timeline**: combined plot of SOC, pack current, temperature, and max discharge power vs time — each event (startup, cold acceleration, highway cruise, regen, thermal warning, parking) as annotated vertical markers. The central visual of this post.
- `[DIAG]` Startup sequence quick-reference: numbered steps from key press to "Ready" with timing callouts
- `[DIAG]` CAN message stream snapshot: what messages the BMS is sending at each phase of the drive, with rates and content

#### BMS Validation

- `[DIAG]` V-model diagram: left arm (system requirements → software architecture → unit design → code) and right arm (unit test → integration → system → vehicle validation) with BMS-specific examples at each level
- `[DIAG]` Test pyramid: MiL → SiL → HIL → Pack → Vehicle — left axis = cheap/fast, right = expensive/slow; bugs caught at each level illustrated
- `[DIAG]` HIL architecture block diagram: battery simulator (cell voltage sources + programmable current source + CAN generator) connected to real BMS ECU, with dSPACE/NI platform labeled
- `[TABLE]` DFMEA-to-test-case mapping: failure mode → test stimulus → expected response → pass criterion

---

### Interfaces

#### Communication Interface

- `[DIAG]` Communication layers block diagram: cells → AFE (SPI) → MCU → CAN bus → VCU / Dashboard / OBC / Charger — the overview for the entire interfaces section
- `[DIAG]` Charger communication stack: J1772 pilot signal (AC Level 2) → CHAdeMO CAN (DC fast) → CCS PLC ISO 15118 (V2G)

#### CAN Bus

- `[DIAG]` Physical layer: CAN_H and CAN_L differential pair, 120Ω termination at each end, linear bus topology
- `[ANIM]` Differential signaling: noise couples equally to both wires, cancels in the difference — the "why differential" intuition animated
- `[ANIM]` CAN frame anatomy: bit-by-bit walk through an 11-bit standard frame, each field lighting up as it's explained (SOF, ID, DLC, Data, CRC, ACK)
- `[ANIM]` Bus arbitration: two nodes start transmitting simultaneously, one recedes at the bit where IDs diverge — non-destructive collision resolution
- `[DIAG]` Bit stuffing: 5 consecutive same-polarity bits → inserted stuff bit → receiver removes it
- `[TABLE]` BMS CAN message table (ID / name / period / content) — styled visual
- `[DIAG]` DBC signal entry annotated: `SOC : 0|8@1+ (0.5,0) [0|100]` syntax broken down field by field
- `[DIAG]` CAN FD vs classical CAN: frame structure comparison, payload size and speed difference

#### RS-485 / RS-232

- `[DIAG]` UART frame: mark → start bit → D0…D7 → stop bit, with timing marks
- `[DIAG]` RS-232 vs RS-485 voltage levels: single-ended ±15V vs differential ±200mV minimum — side by side showing noise margin improvement
- `[DIAG]` RS-485 termination and fail-safe biasing: pull-up on A line, pull-down on B line, 120Ω at each cable end
- `[DIAG]` Modbus RTU frame structure: address + function code + data + CRC-16, annotated
- `[DIAG]` DE/RE direction control timing: assert DE → send bytes → de-assert DE → listen
- `[TABLE]` RS-232 vs RS-485 vs CAN comparison table — styled visual

---

### EV

#### EV Nodes

- `[DIAG]` **Full EV node map**: VCU, BMS, MCU, OBC, DCDC, TMC, Gateway, BCM, ABS/ESC, ADAS domain, Instrument Cluster, Telematics — connected across powertrain / body / chassis / infotainment CAN buses. The showpiece diagram of this post.
- `[DIAG]` BMS data flow: all inputs to BMS and all outputs, with which node receives each output
- `[DIAG]` Node startup sequence timing diagram: numbered steps from 12V wake-up to Drive Ready signal
- `[DIAG]` OTA update flow: telematics ECU → gateway → target ECU, with integrity verification and rollback
- `[DIAG]` Fault cascade: BMS opens contactors → MCU loses HV → motor stops → ABS detects unexpected decel → correction braking — linear chain diagram

#### Why Range Drops in Winter

- `[CHART]` Three-factor range loss: stacked bar chart — summer baseline vs winter, each segment = capacity derating + SOP loss + heating energy cost
- `[CHART]` Internal resistance vs temperature: Arrhenius curve from 0°C to 45°C (cross-reference with SOP post)
- `[CHART]` Heat pump vs PTC heater: COP curve vs temperature, showing 3–4× energy efficiency advantage
- `[CHART]` Fleet data: winter range as % of rated range by vehicle model, heat pump vs no heat pump — from `[PUB]` Recurrent Auto published data
- `[DIAG]` Preconditioning effect: timeline showing energy drawn from grid (free) vs from battery (costs range) — side by side
- `[CHART]` Winter energy budget as a Sankey diagram or stacked bar: propulsion / cabin heating / battery heating / rolling resistance — where every kWh goes on a cold drive

---

## Summary Counts

| Type | Approximate Count |
|---|---|
| Animations `[ANIM]` | ~20 |
| Charts / Graphs `[CHART]` | ~30 |
| Diagrams `[DIAG]` | ~65 |
| Tables `[TABLE]` | ~10 |
| From publications `[PUB]` | ~8 |
| **Total** | **~133** |

---

## Notes on Tooling

- **Animations**: D3.js or Observable Plot for data-driven; p5.js for physics-style; Plotly for interactive charts with sliders
- **Diagrams**: Excalidraw (hand-drawn aesthetic, easy to export SVG), draw.io (precise, block diagrams), or raw SVG for circuits
- **Charts**: Python (matplotlib / Plotly) for experimental data; Observable notebooks for interactive versions
- **Circuit diagrams**: KiCad schematic editor or CircuitLab for proper circuit schematics; export as SVG
- **Published figures**: always cite with figure number, paper, DOI, and license — prefer open-access papers (Nature Energy, J. Power Sources many are accessible)

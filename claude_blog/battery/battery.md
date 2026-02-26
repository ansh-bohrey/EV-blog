# Battery Pack & Module Architecture — From Individual Cells to 400 Volts

*Prerequisites: [Cell →](./cell.md)*
*Next: [Thermal Management →](./cooling.md)*

---

## From a 3.6 V Cell to a 400 V Pack

A single NMC cell delivers about 3.6 volts and 5 ampere-hours. An EV needs roughly 400 volts and 100–200 ampere-hours. Simply scaling up to a single enormous cell introduces steep tradeoffs: manufacturing yield degrades at large electrode areas, thermal gradients across a large cell become unmanageable, and a single-cell fault represents a catastrophic single point of failure. Practical EV packs therefore use many cells in series and parallel rather than a few extremely large ones.

The answer is to connect many cells together. But *how* you connect them — in series, in parallel, or both — determines the pack's voltage, capacity, impedance, fault sensitivity, and thermal behaviour. That decision is the foundation of pack architecture, and it is what this post is about.

---

## The Two Levers: Series and Parallel

### Series — Add Voltage

Connect cells end-to-end, positive terminal of one to the negative terminal of the next.

```
[Cell 1] ── [Cell 2] ── [Cell 3] ── [Cell 4]
  3.6V         3.6V        3.6V       3.6V    →  14.4V total
```

**What adds:** voltage. 10 cells × 3.6 V = 36 V.

**What stays the same:** capacity. The pack can still deliver only as many ampere-hours as a single cell.

**What adds too:** internal resistance. R_pack = N × R_cell. Ten cells in series with 80 mΩ each give a pack internal resistance of 800 mΩ.

**The constraint:** every cell in a series string carries identical current. There is no averaging. If one cell has lower capacity, it runs out first and its terminal voltage drops — pulling the pack's total voltage down to the cutoff even though the other cells still have charge. The weakest cell dictates when the pack is "empty." This is the fundamental reason cell matching and balancing matter.

### Parallel — Add Capacity

Connect cells side by side, all positive terminals together, all negative terminals together.

```
[Cell 1]
[Cell 2]  all + together, all − together → 3.6V, 3× capacity
[Cell 3]
```

**What adds:** capacity. 3 cells in parallel with 5 Ah each = 15 Ah.

**What stays the same:** voltage. Still 3.6 V.

**What divides:** internal resistance. R_pack = R_cell / N. Three 80 mΩ cells in parallel = 26.7 mΩ — the pack can deliver higher current with less IR drop.

**The complexity:** parallel-connected cells at different states of charge will attempt to self-balance — current flows between them through the busbars. During normal operation this is fine. A cell failure (sudden drop in voltage) can drive significant current through the parallel group and into the failed cell, potentially causing a fire. Parallel groups require current fuse protection between cells, or the pack design must tolerate a cell failure by fusing it open (a design strategy used in some cylindrical-cell packs).

### Series-Parallel (xSyP)

Real packs combine both. The notation **xSyP** means x cells in series, each series position having y cells in parallel.

Example: **96S3P** with 5 Ah cells:
- Pack voltage: 96 × 3.6 V = 345.6 V
- Pack capacity: 3 × 5 Ah = 15 Ah
- Pack energy: 345.6 V × 15 Ah = 5.18 kWh (one module; a full pack would have multiple modules in series)
- Pack internal resistance: (80 mΩ / 3) × 96 = 2.56 Ω

The two diagrams below show the series and parallel wiring topologies, and how they combine in a real xSyP pack.

![Series, parallel, and series-parallel cell wiring topologies](../assets/claude_assetsplan/battery/series-parallel-diagrams.svg)

---

## Why 400 V? (And Why 800 V?)

The system voltage is the most consequential architectural decision in pack design. The physics reason:

For a given power level, P = V × I. Doubling voltage halves current. Lower current means:
- Thinner, lighter copper cables and busbars
- Less I²R resistive heating in the wiring
- Smaller, cheaper connectors and contactors
- Easier thermal management of the HV harness

**400 V** has been the EV standard since the first-generation Nissan Leaf and Tesla Model S. It is a practical sweet spot — high enough to significantly reduce current vs 12V or 48V systems, low enough that insulation and component costs remain manageable.

**800 V** is the frontier: Porsche Taycan, Hyundai Ioniq 5/6, Kia EV6, and an increasing number of premium EVs. The primary driver is charging speed. A DC fast charger supplying 150 kW to a 400 V pack must deliver 375 A through the charging cable — a cable that gets hot and heavy at that current. An 800 V pack takes the same 150 kW at only 187 A — a cable that is significantly lighter and cheaper. This also enables 350 kW charging at reasonable cable currents, which is why 800 V EVs lead in charging speed.

Going above 800 V has diminishing returns: component costs (inverter switches, insulation) rise steeply, and the human safety hazard increases. 400 V and 800 V are the two dominant architectures for the foreseeable future.

---

## The Pack Hierarchy

Modern EV packs are organised in three levels — or two, in the newer cell-to-pack designs.

![Pack hierarchy — cell, module, pack, and cell-to-pack (CTP)](../assets/claude_assetsplan/battery/pack-hierarchy.svg)

### Cell

The fundamental electrochemical unit. Covered in the Cell post. The BMS monitors each cell (or each parallel group as a unit) individually.

### Module

A mechanically and electrically contained group of cells. A module typically contains 12–24 cells (some larger) in an xSyP arrangement, with its own:
- Cell holders or compression plates (depending on format)
- Copper or aluminum busbars welded or bolted to cell terminals
- Voltage sense wires running to each cell terminal (or each parallel group)
- Thermistors on representative cells and on the module housing
- Thermal interface material bonding cells to the module baseplate

In traditional pack designs (Nissan Leaf Gen1, early GM Volt), modules are individually replaceable units. This makes repair and second-life assessment tractable — a single failed module can be swapped without replacing the whole pack. The trade-off is the overhead: module housings, end-caps, and connectors add weight and volume that do not store energy.

### Pack

N modules connected in series (and sometimes in parallel for multi-pack architectures). The pack enclosure is the outermost structure — typically aluminium extrusion or stamped steel, sealed to IP67 (dust-tight and waterproof at 1 m depth). Inside the pack enclosure:

- **HV contactor assembly:** main positive and negative contactors (relay-type switches rated for HV DC interruption) plus a pre-charge contactor and resistor. These open and close the HV circuit under BMS control.
- **Current sensor:** hall-effect or shunt-based, measures total pack current. The BMS's primary input for Coulomb counting.
- **Manual Service Disconnect (MSD):** a physical plug at the mid-point of the series string that a technician removes before working on the HV system. Splitting the string at the MSD breaks the complete HV circuit so current cannot flow through the full pack, but each sub-pack half remains at high voltage — a 400 V pack split at the midpoint still has approximately 200 V on each side. Safe-work procedures and voltage verification before contact are always required. The MSD location must be accessible without entering the vehicle.
- **BMS electronics:** main BMS controller, cell monitoring ICs (AFE), communication interfaces.
- **Cooling hardware:** cooling plates, inlet/outlet ports, thermistors, and tubing.

### Cell-to-Pack (CTP)

The latest evolution: eliminate the module layer. Cells go directly into the pack enclosure, which becomes the structural housing. The module's functions — compression, thermal contact, electrical interconnection — are handled at the pack level.

CATL's **Blade Battery** is the defining example: ultra-long LFP prismatic cells span the full width of the pack. The cells themselves provide structural rigidity — the pack lid and floor are bonded to the cell surfaces with structural adhesive. No module housing, no module end-caps, no inter-module connectors. Pack volumetric efficiency improves by 15–50% depending on the comparison, which partially offsets LFP's lower cell-level energy density.

The BMS implications of CTP are significant: the wire harness now runs from thousands of individual cells (or parallel groups) directly to the main BMS, rather than to a small number of module connectors. Cell monitoring IC daisy-chain topologies (like TI BQ76940) become more critical.

The repairability implication: without module granularity, a CTP pack is typically "replace the pack" rather than "swap a module." Second-life assessment is harder. The EU Battery Regulation's upcoming battery passport requirement is partly a response to this trend.

---

## Cell-to-Module: Engineering Details

### Busbars

Busbars are the metal conductors connecting cell terminals. They carry the full pack current and must be sized appropriately: at 200 A continuous, even a short 50 mm copper busbar at 4 mm² cross-section will reach 60–70°C without cooling.

Modern packs use flexible busbars (part of a **Cell Contact System, CCS**): a laser-cut or stamped copper or aluminium sheet bonded to an insulating carrier film, which allows the busbar to flex and absorb dimensional variation between cells and cell-to-module thermal expansion. Cell terminals are laser-welded to the CCS in a fully automated process — the weld quality is a major source of pack-to-pack resistance variation.

For cylindrical cells, the CCS often integrates the voltage sense wires as embedded conductive traces, eliminating a separate wiring harness step.

### Mechanical Compression

Prismatic and pouch cells expand as they cycle — lithium intercalation causes the electrode stack to swell by up to 3% in volume over the life of the cell. Left unconstrained, this leads to delamination (electrode layers separating from each other) and reduced cycle life.

Modules and pack structures apply controlled compression:
- **Prismatic:** metal end-plates with springs or tie-rods maintain a calibrated preload force of typically 1–3 MPa on the cell faces throughout the cell's expansion range.
- **Pouch:** foam or spring compression plates on each side of the cell stack, providing uniform pressure without rigid constraint.

Cylindrical cells have rigid steel cases — no external compression is needed. This is one of the manufacturing simplicity advantages of cylindrical cells that partially offsets their geometric packing inefficiency.

### Cell Holders and Bonding

Cylindrical cells in a module or pack sit in plastic cell holders that maintain inter-cell spacing for air flow or cooling plate contact, damp vibration, and prevent cell-to-cell electrical contact. In some designs (Tesla Model 3/Y), cells are bonded directly to the cooling plate with thermally conductive structural adhesive — the adhesive is both the thermal interface and the primary structural bond.

---

## HV Isolation and Safety

### Galvanic Isolation

The HV pack (400 V) operates as a floating system — electrically isolated from the vehicle chassis (12 V system reference) and from the high-voltage ground. This is not an accident. An isolated HV system means that a person touching a single HV conductor while standing on ground is not completing a circuit through their body — there is no path for current to flow unless they touch both HV+ and HV− simultaneously, which is mechanically prevented by connector design.

The **Isolation Monitoring Device (IMD)** continuously measures the impedance from HV+ and HV− to chassis ground. The minimum isolation resistance is specified as a ratio to voltage: ISO 6469-3:2021 requires at least 100 Ω/V for DC systems, which for a 400 V pack corresponds to 40 kΩ minimum. A healthy, new insulation system will measure many hundreds of kΩ or higher, but the fault threshold that triggers a DTC is set well above the regulatory minimum. If isolation drops (due to damaged insulation, moisture ingress, or a wiring fault), the BMS raises a ground fault DTC and reduces pack power, requiring service.

### Manual Service Disconnect (MSD)

A plug-and-socket connector positioned at the mid-point of the battery series string. When removed by a technician, it opens the series circuit so current cannot flow through the complete HV path — but each sub-pack half remains at high voltage. A 400 V pack split at the midpoint still has approximately 200 V on each side. The 60 V DC SELV threshold defined in ECE R100 and ISO 6469-3 is a connector safety requirement (exposed connector pins must be de-energised or shrouded below 60 V when unmated), not a guarantee that sub-pack voltage is below 60 V. Safe-work procedures always require voltage verification before touching any HV component.

The MSD is keyed, colour-coded orange, and must be removed before any HV connector is touched. Most EVs have an HVIL signal through the MSD that causes the BMS to open the main contactors if the MSD is pulled with the vehicle on.

### Pyrotechnic Fuse

A crash-activated fuse in series with the HV circuit, typically in the positive cable. When the airbag ECU detects a crash (from the accelerometer), it fires the pyro-fuse via a squib — permanently cutting the HV circuit within milliseconds. Unlike a contactor (which can weld closed), a pyro-fuse is a one-shot, highly reliable means of opening the HV circuit — designed to sever the circuit even if contactors have welded. It cannot be reset. It is the last resort in the HV protection chain.

---

## Pack-Level Electrical Parameters — Worked Example

Take a 96S3P pack with Samsung INR21700-50E cells (5 Ah, 3.6 V nominal, 30 mΩ DCIR):

| Parameter | Calculation | Result |
|---|---|---|
| Pack nominal voltage | 96 × 3.6 V | 345.6 V |
| Pack V_max | 96 × 4.2 V | 403.2 V |
| Pack V_min | 96 × 2.5 V | 240 V |
| Pack capacity | 3 × 5 Ah | 15 Ah |
| Pack energy | 345.6 V × 15 Ah | 5.18 kWh |
| Pack DCIR | (30 mΩ / 3) × 96 | 960 mΩ |
| Pack peak power (2C, 3.5 V/cell average) | 2 × 15 A × 96 × 3.5 V | 10.1 kW |

A full-vehicle pack would have multiple of these modules: a 75 kWh pack at this cell choice requires 75 / 5.18 ≈ 14.5 → 15 modules. Pack voltage stays the same (all modules in series), total capacity multiplies.

**Key insight:** the 960 mΩ pack internal resistance means that at 100 A continuous discharge (1.5 kW from a 96 V perspective, but actually 96 × ... wait — at 100 A pack current, voltage drop = 100 A × 0.96 Ω = 96 V drop from the open-circuit value). Pack design must account for this when sizing cables and predicting minimum voltage under peak load.

---

## Pack-Level vs Cell-Level Limits

The BMS always operates on the *most constrained cell* at any moment — not the average.

**Temperature:** if cells at the pack periphery are at 25°C but cells in the pack centre have reached 38°C, the BMS derate based on 38°C. The hotter cells are closer to thermal runaway risk.

**Voltage:** the cell whose voltage hits V_min first terminates the discharge for the whole pack — even if every other cell has 15% SOC remaining. A single weak cell can cost the pack 10–15% of usable range. This is why cell matching during manufacturing and balancing during operation matter so much.

**SOC:** the BMS estimates per-cell SOC (or per-parallel-group SOC) and tracks the spread. When cells are significantly imbalanced, the cell at lower SOC limits discharge capacity even though the pack average SOC appears healthy.

This is the motivation for cell balancing — the subject of its own post. The relationship between cell-level limits and pack-level capability is the core of BMS energy management.

---

## Repairability and Second Life

Traditional module-based pack designs allow module-level repair: identify the failed module, swap it, recalibrate the BMS. Economically viable for expensive packs. Nissan offered Leaf module replacement programs. Third-party EV repair shops routinely rebuild packs by replacing individual modules.

CTP designs make this largely impossible — there is no module-level granularity to replace. A cell failure typically means replacing the pack. This drives up the total cost of ownership for out-of-warranty repairs and raises end-of-life recycling complexity.

**Second-life use:** EV packs retired at 80% SOH (common at 150,000–200,000 km) have substantial remaining value for stationary storage applications — grid balancing, solar storage, commercial backup. This requires accurate knowledge of individual cell or module health. CTP packs are harder to assess and repurpose at module granularity. The EU Battery Regulation 2023 mandates digital battery passports for large traction batteries from 2027 — a record of the pack's composition, cell chemistry, and measured health — partly to enable this second-life market.

---

## Takeaways

- **Series + parallel topology is the foundational pack design decision.** It determines voltage (series count), capacity (parallel count), impedance, fault sensitivity, and BMS monitoring complexity.

- **400 V is the current EV standard; 800 V unlocks faster charging** by halving cable current at the same power level. Most new high-performance EV platforms are 800 V.

- **The pack hierarchy is cell → module → pack**, or cell → pack in CTP designs. Each layer adds structural protection, thermal management, and electrical interconnection — at a cost in mass and volume.

- **The weakest cell sets the pack limit.** Everything the BMS does — monitoring, balancing, protecting — exists to prevent a single cell from constraining the whole pack prematurely or failing dangerously.

- **CTP trades repairability for density and cost.** It is winning commercially but creates challenges for repair, second life, and end-of-life recycling that are still being addressed by regulation.

---

## Experiment Ideas

### Experiment 1 — Build a 4S Pack and Measure Parameters

**Materials:** 4× matched 18650 cells (same batch, within 10 mV of each other OCV), plastic cell holders, nickel strip or fine wire for connections, DMM, INA219 + Arduino

**Procedure:**
1. Measure each cell's OCV and DCIR individually.
2. Assemble in 4S series. Measure pack OCV — verify it equals the sum of cell OCVs.
3. Measure pack DCIR with a 1 A pulse — verify ≈ sum of cell DCIRs.
4. Discharge pack at 0.5 A, logging pack voltage and each individual cell voltage simultaneously using four voltage dividers to Arduino ADC pins.

**What to observe:** Pack voltage tracks the sum of cell voltages identically throughout discharge. Watch which cell's voltage drops fastest — if cells are mismatched, the lowest-capacity cell will pull down the pack. The pack hits cutoff when the weakest cell hits its minimum, even if others still have charge. This makes cell matching's purpose concrete and measurable.

### Experiment 2 — Series vs Parallel: Energy Is Conserved, Topology Just Redistributes It

**Materials:** 4× 18650 cells, a way to reconfigure them between 4S1P and 2S2P, INA219

**Procedure:**
1. Charge all cells to the same SOC. Measure total open-circuit energy (sum of V × estimated Ah across all cells).
2. Configure 4S1P. Discharge at 250 mA to the 4S cutoff voltage. Record total mAh and total Wh.
3. Re-charge. Configure 2S2P. Discharge at 500 mA (same per-cell current) to the 2S cutoff. Record mAh and Wh.

**What to observe:** Total Wh delivered is approximately equal in both configurations — the energy stored does not change based on how cells are wired together. Voltage scales with series count, current scales with parallel count, but energy is conserved. The mAh per configuration will differ (higher mAh from 2S2P which has double the capacity in Ah), but the watt-hours should match closely if cell matching was good.

### Experiment 3 — Isolation Resistance Principle

**Materials:** 9 V battery (simulating a floating HV pack), two 10 MΩ resistors, a DMM with MΩ range, a 1 MΩ "fault" resistor

**Procedure:**
1. Connect the 9 V battery floating (no connection to any reference). Measure resistance from 9 V+ to your bench ground: should be >100 MΩ (immeasurable on most DMMs — an open circuit).
2. Connect a 1 MΩ resistor from 9 V+ to bench ground (simulating an insulation fault). Measure resistance again — now reads 1 MΩ.
3. Calculate implied leakage at 9 V: I = 9 V / 1 MΩ = 9 µA. Scale to a 400 V pack: 400 V / 1 MΩ = 400 µA. Still not fatal to touch — but detectable and reportable by an IMD.
4. Calculate at 10 kΩ fault (very degraded insulation): 400 V / 10 kΩ = 40 mA — dangerous.

**What to observe:** The principle of isolation monitoring — a floating HV system is safe in isolation; the danger arises when isolation degrades. The IMD detects the early stages of degradation (MΩ range) long before the isolation becomes dangerous.

---

## Literature Review

### Core Textbooks

- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010, Artech House) — Chapter 3 covers pack architecture and topology in practical detail; best single reference for series/parallel trade-offs
- **Warner, J.T.** — *The Handbook of Lithium-Ion Battery Pack Design* (Elsevier, 2015) — dedicated to pack engineering; covers module design, HV isolation, busbar sizing, and mechanical compression in depth
- **Ehsani, M. et al.** — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles, 3rd edition* — EV powertrain architecture and pack voltage selection rationale from a vehicle systems perspective

### Key Papers

- **Saw, L.H. et al.** (2016) — "Integration issues of lithium-ion battery into electric vehicles battery pack" — *J. Cleaner Production* 113 — covers wiring, cooling integration, and safety challenges in pack assembly
- **Ciez, R.E. & Whitacre, J.F.** (2017) — "Comparison between cylindrical and prismatic lithium-ion cell costs using a process-based cost model" — *J. Power Sources* 340 — rigorous format trade-off including pack-level integration costs
- **Zubi, G. et al.** (2018) — "The lithium-ion battery: State of the art and future perspectives" — *Renewable and Sustainable Energy Reviews* 89 — includes pack architecture trends and CTP development

### Online Resources

- **Munro & Associates** — YouTube teardowns of the Tesla 4680 pack, Chevy Bolt module, and Ioniq 5 800 V pack; the best public-domain pack design analysis available
- **CATL** — official technical blog and press releases on Blade Battery and CTP3.0 technology
- **EU Battery Regulation 2023** — European Parliament full text (EUR-Lex) — defines battery passport, second-life, and end-of-life requirements coming into force 2024–2027

### Standards

- **ECE R100** — UN Regulation No. 100 on EV safety; defines SELV threshold (60 V DC), isolation resistance requirements, post-crash electrical safety
- **FMVSS 305** — US Federal Motor Vehicle Safety Standard 305: electric-powered vehicle electrolyte spillage and electrical shock protection
- **ISO 6469-1** — Safety requirements for on-board energy storage for electrically propelled road vehicles
- **SAE J2929** — Safety standard for EV and HEV battery pack systems; covers cell-to-pack topology and fault management

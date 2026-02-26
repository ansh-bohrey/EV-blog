# Battery (Pack / Module Architecture) — Blog Plan

## Goal
Explain how individual cells are assembled into modules and packs, how series/parallel configurations determine pack voltage and capacity, and what the structural and electrical design decisions look like — from "why not just use one big cell?" to the difference between a module and a pack.

## Audience Angles
- **Engineers / students**: Series/parallel impedance math, xSyP notation, busbar sizing, cell-to-module and cell-to-pack design, mechanical compression requirements, HV isolation
- **EV enthusiasts**: "How does a 400V battery come from 3.6V cells?", why different EVs have different pack voltages, what "module" means, why packs are so hard to repair

---

## Subtopic Flow

### 1. Hook — From AA Battery to 400 Volts
- A single NMC cell is ~3.6V at 5Ah. A typical EV needs ~400V and 150Ah.
- You can't just build a bigger cell — manufacturing, safety, and thermal management all constrain cell size
- The answer: connect many cells together. But how you connect them determines everything about the pack's voltage, capacity, power, and behavior.

### 2. Series and Parallel — The Two Levers

**Series connection (cells end-to-end like a torch):**
- Each cell's voltage adds: 10 cells × 3.6V = 36V
- Capacity stays the same as one cell
- Internal resistance adds: R_pack = N × R_cell
- Current through every cell is identical
- Weakest cell limits the string (lowest capacity cell runs out first, highest-internal-resistance cell drops furthest under load)

**Parallel connection (cells side-by-side, + to +, - to -):**
- Voltage stays the same as one cell
- Capacity multiplies: 10 cells in parallel = 10× the Ah
- Internal resistance divides: R_pack = R_cell / N
- Each cell carries its share of the total current
- Imbalance risk: cells at different SOC try to equalize — current flows between them; higher risk at contact point if a cell fails

**Series-parallel (xSyP notation):**
- A pack described as 96S3P: 96 cells in series, each series position has 3 cells in parallel
- Total voltage: 96 × 3.6V = 345.6V
- Total capacity: 3 × cell capacity (e.g., 3 × 5Ah = 15Ah)
- Total energy: 345.6V × 15Ah = 5.2 kWh (one module; multiple modules make a full pack)

### 3. Why 400V? (And Why 800V?)
- Motor inverters work better at higher voltage: for a given power (P = V × I), higher voltage means lower current → thinner cables, lighter connectors, less I²R heat
- 400V has been the EV standard for ~15 years (Tesla Model S, Nissan Leaf, etc.)
- 800V is the new frontier: Hyundai Ioniq 5/6, Porsche Taycan, Kia EV6 — enables faster charging (same power at lower current = no cable superheat) and lighter cabling
- Going higher than 800V has diminishing returns and higher insulation cost; 400V and 800V are the two main architectures today

### 4. Pack Hierarchy — Cell → Module → Pack

**Cell**: the fundamental electrochemical unit (covered in Cell post)

**Module**:
- A mechanically and electrically contained group of cells (e.g., 12 cells in 6S2P)
- Has its own busbars, cell holders, thermal interface, module-level voltage sense wires
- In older pack designs (Nissan Leaf Gen1, early Tesla): individual modules replaceable — easier repair but heavier
- Module-level BMS or sub-BMS sometimes present for distributed monitoring

**Pack**:
- N modules connected in series (or parallel if multi-module paralleling)
- Pack enclosure: aluminum or steel housing, IP67 or higher water/dust ingress protection
- Contains: HV contactors and pre-charge circuit, current sensor (shunt or Hall), manual service disconnect (MSD), HV harness, BMS electronics, cooling hardware (plates, pumps, hoses)
- Crash structure: must protect cells in a front/rear/side impact; regulated by FMVSS 305 (US), ECE R100 (Europe)

**Cell-to-Pack (CTP)**:
- Emerging design: eliminate module layer entirely, put cells directly in the pack
- CATL blade battery: ultra-long LFP cells span the full pack width; the cell itself contributes to structural rigidity
- Advantages: higher pack volumetric efficiency, lower part count, lower cost
- Disadvantages: cell-level repairability is gone; thermal management more complex; higher BMS wire count from cells directly to main BMS

### 5. Cell-to-Module Design Details

**Busbar design**:
- Busbars connect cell terminals in series or parallel — copper or aluminum, laser-welded or bolted
- Must carry full pack current; sized for current density and temperature rise
- Flexible busbars (CCS — Cell Contact System) accommodate cell swell and manufacturing tolerances

**Mechanical compression**:
- Prismatic and pouch cells swell during cycling (volume change up to 3%)
- Compression plates and end brackets apply controlled mechanical pressure to maintain cell/electrode contact and limit swell
- Too little pressure: cell swells freely → delamination → capacity loss
- Too much pressure: mechanically stresses electrodes
- Cylindrical cells: self-contained rigid case, no external compression needed

**Cell holders and spacers**:
- Cylindrical cells: plastic cell holders maintain spacing for thermal management and vibration resistance
- Adhesive bonding: some designs bond cells to the cooling plate with thermally conductive adhesive (structural and thermal simultaneously)

### 6. HV Isolation and Safety Architecture

**Galvanic isolation**:
- The HV pack (400V) must be isolated from the vehicle chassis and 12V system
- Isolation resistance: typically required >500 MΩ at full pack voltage
- Monitored by the BMS/IMD (Isolation Monitoring Device) — reports ground faults

**Manual Service Disconnect (MSD)**:
- A physical plug (usually mid-pack) that a technician removes to break the HV circuit before service
- Reduces pack to two safe sub-sections (each below 60V DC per ECE R100 definition of SELV)
- MSD location must be accessible from outside or under the vehicle

**HVIL (High Voltage Interlock Loop)**: covered in Ignition Handling post — runs through all HV connectors and contactors to detect open or missing connections

**Fuses**:
- Fast-acting pyrotechnic fuse (crash fuse): activated by crash sensor via airbag ECU — permanently disconnects pack within microseconds of crash detection
- Current fuse: protects against sustained overcurrent if BMS contactor fails to open

### 7. Pack-Level Electrical Parameters
- **Pack voltage**: N_series × V_cell_nominal (and V_max / V_min)
- **Pack capacity**: N_parallel × C_cell
- **Pack energy**: V_pack_nominal × C_pack (in Wh or kWh)
- **Pack internal resistance**: R_series + (R_cell / N_parallel) × N_series
- **Pack C-rate limit**: derived from cell C-rate × N_parallel (parallel cells share current)
- Walk through a worked example: 96S3P NMC with Samsung 50E cells (5Ah, 3.6V, 30mΩ) → pack voltage, energy, resistance

### 8. Pack-Level vs Cell-Level Limits
- The BMS sets pack current limits based on the *most constrained* cell at any moment
- Under cold conditions: all cells derate → pack power limit falls
- With one weak cell (higher R): that cell's voltage drops faster under load → pack discharge cutoff is triggered by the weakest cell
- This is why cell matching and balancing are so important at the pack level (link to Cell Balancing post)

### 9. Repairability and Second Life
- Traditional module-based designs: swap a module, keep the rest — economically viable
- CTP designs: often "fix or scrap the pack" — no module granularity for repair
- Second-life use: packs retired from EVs at 80% SOH used in stationary storage — requires knowing cell/module-level SOH, which is harder in CTP designs
- Battery passport (EU Battery Regulation 2023): OEMs will be required to provide digital records of pack composition, chemistry, and health — makes second-life assessment easier

### 10. Takeaways
- Pack design is the translation layer between individual cell chemistry and real-world EV requirements
- Series/parallel topology is the most fundamental design decision — it determines pack voltage, capacity, impedance, and fault sensitivity
- Module vs CTP is the current design pendulum — CTP wins on cost and energy density; module wins on repairability
- Understanding the pack hierarchy is essential context for everything else in the BMS series

---

## Experiment Ideas

### Experiment 1: Build a 4S Pack and Measure Parameters
**Materials**: 4× matched 18650 cells (same batch, within 10mV of each other), cell holders, nickel strip or wire, DMM, INA219
**Procedure**:
1. Measure individual cell OCV, internal resistance (DCIR) before assembly
2. Assemble 4S series string with care (polarity!)
3. Measure pack OCV — verify = sum of cell OCVs
4. Measure pack DCIR — verify ≈ sum of cell DCIRs
5. Discharge pack at 0.5A, log pack voltage and individual cell voltages simultaneously

**What to observe**: Pack voltage = sum of cell voltages at all times. The cell with lowest capacity reaches cutoff first. Show how one weak cell constrains the whole string.

### Experiment 2: Series vs Parallel Capacity Comparison
**Materials**: 4× 18650 cells, switching setup to reconfigure 2S2P vs 4S1P vs 1S4P
**Procedure**:
1. Config 1 (2S2P): measure pack voltage, discharge at 500mA to cutoff, measure total mAh
2. Config 2 (4S1P): measure pack voltage, discharge at 250mA (same absolute C-rate per cell) to cutoff, measure total mAh
3. Config 3 (1S4P): measure pack voltage, discharge at 1A (same per-cell rate) to cutoff, measure total mAh

**What to observe**: Verify voltage and capacity scaling rules experimentally. Confirm that total Wh is approximately equal across all configurations (energy is conserved regardless of topology).

### Experiment 3: Isolation Resistance Test (Safe Scale Simulation)
**Materials**: 9V battery (simulating HV pack), 10MΩ resistor to simulate insulation, DMM with MΩ range
**Procedure**:
1. Measure resistance from 9V+ terminal to "chassis" (a reference ground) with no fault: should be very high (>100MΩ in a clean system)
2. Introduce a fault: connect a 1MΩ resistor from pack+ to chassis — measure the drop in isolation resistance
3. Compute implied leakage current: I = V / R_fault = 9V / 1MΩ = 9µA — harmless at 9V; at 400V = 400µA — still small but now detectable and code-of-practice reportable

**What to observe**: Demonstrates the principle of isolation monitoring. Scale the numbers to 400V pack and 500kΩ fault for discussion.

---

## Literature Review

### Core Textbooks
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* — pack architecture chapter; best practical reference for series/parallel topology and module design
- **Warner, J.T.** — *The Handbook of Lithium-Ion Battery Pack Design* (Elsevier, 2015) — dedicated to pack engineering; covers module design, thermal, mechanical, electrical in depth
- **Ehsani, M. et al.** — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles* — EV power train architecture and pack voltage selection rationale

### Key Papers
- **Saw, L.H. et al.** (2016) — "Integration issues of lithium-ion battery into electric vehicles battery pack" — *J. Cleaner Production* — pack integration challenges
- **Zubi, G. et al.** (2018) — "The lithium-ion battery: State of the art and future perspectives" — *Renewable and Sustainable Energy Reviews* — includes pack architecture trends
- **Ciez, R.E. & Whitacre, J.F.** (2017) — "Comparison between cylindrical and prismatic lithium-ion cell costs" — *J. Power Sources* — format trade-off analysis

### Online Resources
- Munro & Associates — YouTube teardowns of Tesla 4680 pack, Chevy Bolt module, Ioniq 5 800V pack — real engineering decisions visible
- Sandy Munro teardown library — best public-domain pack design analysis
- CATL — official blog and press releases on blade battery and CTP technology
- Electrek / InsideEVs — reporting on 800V architecture advantages and charging speed implications
- EU Battery Regulation 2023 — European Parliament text on battery passports and second-life requirements (publicly available)

### Standards / Application Notes
- **ECE R100** — UN Regulation on EV safety; defines SELV threshold (60V DC), isolation resistance requirements
- **FMVSS 305** — US Federal Motor Vehicle Safety Standard for EV post-crash electrical safety
- **ISO 6469-1** — Safety requirements for EV on-board energy storage
- **IEC 62660-2** — Reliability and abuse testing for Li-ion EV cells at module/pack level
- **SAE J2929** — Safety standard for EV and HEV battery packs

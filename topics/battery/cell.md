# Cell — Blog Plan

## Goal
Explain what a Li-ion cell actually is — the chemistry, the physical formats, and the key specs — so that everything built on top of it (BMS, pack design, SOC, SOH) has a solid foundation.

## Audience Angles
- **Engineers / students**: Intercalation mechanism, electrode materials and their trade-offs, capacity fade mechanisms at the atomic level, how to read a cell datasheet and extract key parameters
- **EV enthusiasts**: "What's inside a battery cell?", why different EVs use different chemistries, what 18650 and 4680 mean, why energy density isn't the only thing that matters

---

## Subtopic Flow

### 1. Hook — The Fundamental Unit
- Every EV battery, from a Tata Nexon to a Tesla Semi, is made of cells
- All the complexity of BMS, thermal management, and pack design exists to serve one purpose: keep each individual cell happy
- Understanding the cell is the prerequisite to understanding everything else in this blog series

### 2. What is a Li-ion Cell? — The Concept
- A cell is an electrochemical energy storage device: converts chemical energy ↔ electrical energy
- Three essential components: **anode** (negative electrode), **cathode** (positive electrode), **electrolyte** (ion transport medium)
- Separator: a porous membrane between anode and cathode that prevents electrical contact but allows Li⁺ ions to pass
- During discharge: Li⁺ ions move from anode → electrolyte → cathode; electrons flow through external circuit (that's the current you use)
- During charge: reverse — Li⁺ move back from cathode → anode; powered by external energy source
- Key concept: **intercalation** — lithium ions slot into the layered crystal structure of the electrode materials without permanently changing the host structure (unlike older battery chemistries)

### 3. The Electrodes — What They Are Made Of

**Anode (negative electrode):**
- Almost universally: **graphite** — cheap, abundant, ~372 mAh/g theoretical capacity, well-understood
- Emerging: **silicon-graphite blends** — silicon holds ~10× more Li than graphite (3579 mAh/g) but expands ~300% on charging → particle cracking → capacity fade. Current EV cells: 5–10% Si, improving
- **LTO (Lithium Titanate)**: anode alternative — very safe (no lithium plating risk), extremely long cycle life (>20,000 cycles), but very low energy density and high cost. Used in buses and grid storage.

**Cathode (positive electrode):**
- **LCO (Lithium Cobalt Oxide, LiCoO₂)**: first commercial Li-ion cathode (Sony, 1991). High energy density. Used in phones and laptops, not EVs — too expensive (cobalt), thermally unstable
- **NMC (Lithium Nickel Manganese Cobalt Oxide)**: dominant EV cathode today. Three elements tuned by ratio: N for energy density, M for stability, C for conductivity
  - NMC 111: balanced; NMC 532: more Ni; NMC 622, 811: high-Ni for more energy, less Co, but harder to manage (thermal stability decreases with Ni%)
- **NCA (Lithium Nickel Cobalt Aluminum Oxide)**: used by Tesla (Panasonic). High energy density, good power. Requires tight BMS management.
- **LFP (Lithium Iron Phosphate, LiFePO₄)**: lower energy density than NMC, but outstanding thermal stability (much safer), very long cycle life (2000–4000+ cycles), uses no cobalt. Lower voltage (3.2V nominal vs 3.6V NMC). Dominant in China (CATL blade battery), increasingly used globally for lower-range EVs and stationary storage.
- **LMFP (Lithium Manganese Iron Phosphate)**: emerging — higher voltage than LFP, still cobalt-free. Watch this space.

### 4. Cell Chemistry Comparison Table

| Chemistry | Nom. Voltage | Energy Density (Wh/kg) | Cycle Life | Thermal Safety | Cost | Key Use |
|---|---|---|---|---|---|---|
| LCO | 3.6V | 150–200 | ~500 | Low | High | Phones/laptops |
| NMC 532 | 3.6V | 170–220 | 1000–2000 | Medium | Medium | EVs (most) |
| NMC 811 | 3.6V | 200–260 | 1000–1500 | Medium-Low | Medium | High-range EVs |
| NCA | 3.6V | 200–260 | 1000–2000 | Medium-Low | High | Tesla |
| LFP | 3.2V | 120–165 | 2000–4000+ | High | Low-Medium | Budget EVs, storage |
| LTO | 2.4V | 60–80 | >10,000 | Very High | Very High | Buses, grid |

### 5. Cell Formats — The Physical Packaging

**Cylindrical:**
- Named by diameter × length in mm: 18650 (18mm × 65mm), 21700, 4680
- 18650: the laptop battery cell. Tesla Model S/X/3/Y used 18650 (Panasonic/LG), now moving to 4680
- 4680: Tesla's new "big cylinder" — 46mm × 80mm, ~5× the energy of 18650, tabless design reduces internal resistance, enables faster charge. Manufacturing ramp has been challenging.
- Advantages: mature manufacturing, excellent dimensional consistency, self-contained robust casing
- Disadvantages: gaps between cylindrical cells waste space; requires many small cells in parallel for high current

**Prismatic:**
- Rigid aluminum case, rectangular. Larger format (typically 40–300 Ah per cell)
- Used by: CATL, Samsung SDI, Panasonic prismatic for BMW, Volkswagen
- Advantages: space-efficient packing, simpler module assembly, better thermal contact on flat faces
- Disadvantages: swell management (cells expand during cycling) requires mechanical compression

**Pouch:**
- Laminated flexible aluminum-plastic foil enclosure. Largest design freedom in shape
- Used by: LG Energy Solution, SK Innovation (for GM Ultium, Hyundai)
- Advantages: highest energy density (no heavy metal can), flexible shape for pack design, thin profile
- Disadvantages: requires external mechanical compression to prevent delamination; more complex thermal management; pouch can swell and rupture if abused

**Blade (CATL):**
- CATL's proprietary ultra-long prismatic LFP format — cells span the full pack width, eliminating module layer
- "Cell-to-pack" (CTP) design: no intermediate module housing → higher volumetric efficiency despite lower cell energy density

### 6. Key Cell Specifications — Reading a Datasheet
Walk through the important parameters:
- **Nominal capacity (Ah)**: at standard discharge rate (usually C/5 or C/3) to cutoff voltage
- **Nominal voltage (V)**: average during discharge at standard rate
- **Voltage window**: max charge voltage (V_max) and cutoff voltage (V_min)
- **C-rate**: discharge or charge current normalized to capacity. 1C = full discharge in 1 hour. 2C = in 30 min. C/2 = in 2 hours.
- **Energy density**: gravimetric (Wh/kg) and volumetric (Wh/L) — both matter for EV packaging
- **Cycle life**: number of charge/discharge cycles to reach 80% SOH at specified conditions
- **Internal resistance (DC)**: at 50% SOC, 25°C — determines power capability and heat generation
- **Operating temperature range**: both charge and discharge ranges — different limits, charge is stricter
- **Self-discharge rate**: % per month at storage temperature

### 7. Formation Cycling — How a Cell is Born
- After assembly, a new cell undergoes "formation" — the first charge cycles at the manufacturer
- During formation: SEI (Solid Electrolyte Interphase) forms on the anode surface for the first time
- The SEI is a thin passivation layer that protects the anode from continuous electrolyte reaction — it must form correctly or the cell will have poor cycle life
- Formation is slow, precise, and accounts for significant manufacturing cost and time
- After formation: capacity and OCV-SOC curve are measured; cells are graded and sorted by capacity (this is "cell matching" — cells within ±1% capacity are binned together for pack use)

### 8. What Limits a Cell's Life
- Link forward to SOH post — preview the three main mechanisms: SEI growth, lithium plating, particle cracking
- Introduce the idea that the cell's design (chemistry, electrode thickness, electrolyte additive package) sets the aging trajectory
- Mention that electrolyte additives (e.g., VC, FEC) are a major cell differentiation lever between manufacturers — they are trade secrets

### 9. Takeaways
- The cell is where chemistry meets engineering — everything else in the battery system exists to optimize and protect it
- Chemistry choice (NMC vs LFP) is a system-level decision involving energy density, safety, cost, and cycle life trade-offs
- Format choice (cylindrical vs prismatic vs pouch) affects pack design, thermal management, and manufacturing
- Next: how individual cells are arranged into modules and packs

---

## Experiment Ideas

### Experiment 1: OCV-SOC Curve by Chemistry
**Materials**: 1× NMC 18650 cell, 1× LFP 18650 cell (e.g., IFR18650), precision charger/discharger, DMM, Arduino + INA219
**Procedure**:
1. Fully charge both cells per manufacturer spec, rest 2h
2. Discharge each in 10% SOC steps (by Ah), rest 30 min at each step, record OCV
3. Plot both curves on the same graph

**What to observe**: NMC has a sloped, well-defined curve. LFP has a very flat plateau (~3.2–3.3V) across 20–80% SOC — illustrates why LFP SOC estimation is hard, and why voltage alone is not a reliable indicator of charge state.

### Experiment 2: C-Rate vs Delivered Capacity
**Materials**: 18650 NMC cell, Arduino + MOSFET load + INA219
**Procedure**:
1. Fully charge cell
2. Discharge at C/5 to cutoff voltage, measure total Ah delivered
3. Recharge, discharge at 1C — measure Ah
4. Recharge, discharge at 2C — measure Ah
5. Plot delivered capacity vs C-rate

**What to observe**: At higher C-rates, less capacity is delivered before the voltage cutoff — due to increased IR drop. This is why a battery "feels empty" faster under heavy load. Quantify the capacity loss as a percentage.

### Experiment 3: Internal Resistance Measurement by Format
**Materials**: 18650 cylindrical cell, LFP pouch cell (or prismatic), INA219, fixed load
**Procedure**:
1. Both cells at 50% SOC
2. Apply 1A pulse, measure voltage drop, compute DCIR = ΔV/ΔI
3. Compare DCIR values between cylindrical and pouch at same nominal capacity

**What to observe**: Pouch cells typically have lower DCIR per Ah than cylindrical (better contact area, shorter current path) — illustrates format trade-offs beyond just energy density.

---

## Literature Review

### Core Textbooks
- **Tarascon, J.M. & Armand, M.** (2001) — "Issues and challenges facing rechargeable lithium batteries" — *Nature* 414 — the landmark accessible review of Li-ion fundamentals; start here
- **Linden, D. & Reddy, T.B.** — *Handbook of Batteries* (4th ed., McGraw-Hill) — chemistry-by-chemistry reference
- **Nazri, G.A. & Pistoia, G.** — *Lithium Batteries: Science and Technology* (Springer) — electrode material deep dive

### Key Papers
- **Goodenough, J.B. & Park, K.S.** (2013) — "The Li-ion rechargeable battery: A perspective" — *J. American Chemical Society* — Nobel laureate overview of cathode development history
- **Whittingham, M.S.** (2004) — "Lithium batteries and cathode materials" — *Chemical Reviews* — comprehensive cathode material review
- **Blomgren, G.E.** (2017) — "The development and future of lithium-ion batteries" — *J. Electrochemical Society* 164(1) — accessible history and trajectory
- **Zuo, X. et al.** (2017) — "Silicon-based lithium-ion battery anodes: A chronicle perspective review" — *Nano Energy* — silicon anode status

### Online Resources
- Battery University — "BU-201: How does the Lead Acid Battery Work?" then BU-205 through BU-217 for Li-ion chemistry series
- Epec Engineered Technologies — "Battery Cell Comparison" — practical cylindrical vs prismatic vs pouch comparison
- CATL Battery Technology blog — blade cell and CTP technology explanations
- Munro & Associates YouTube — EV battery teardowns showing real cell formats in production packs
- Dahn Group (Jeff Dahn, Dalhousie) — open-access papers on long-life Li-ion cells; some of the most rigorous cell lifetime research

### Standards / Datasheets to Read
- **Samsung INR21700-50E datasheet** — good example of a well-documented NMC cylindrical cell
- **Panasonic NCR18650B datasheet** — the classic 18650; shows how to read spec tables
- **CATL LFP cell specification sheet** (where publicly available)
- **IEC 62660-1** — Electrochemical performance testing for Li-ion EV cells
- **UN 38.3** — Transport testing; defines abuse tests every production cell must pass

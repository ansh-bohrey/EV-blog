# The Lithium-Ion Cell — The Unit Everything Depends On

*Next: [Battery Pack & Module Architecture →](./battery.md)*

---

## The Fundamental Unit

Every EV battery is made of cells. All the complexity of BMS, thermal management, and pack design exists for one purpose: keep each individual cell healthy and within safe limits. If you understand the cell, the rest of the system starts to make sense.

---

## What a Li-Ion Cell Is

A cell is an electrochemical energy storage device. It converts chemical energy to electrical energy during discharge, and the reverse during charge.

Core components:

- **Anode (negative electrode)**
- **Cathode (positive electrode)**
- **Electrolyte** (ion transport medium)
- **Separator** (porous membrane that prevents electrical contact but allows Li+ ions to pass)

During discharge: Li+ ions move from anode → cathode through the electrolyte. Electrons flow through the external circuit, delivering current to your motor or load. During charge, the flow reverses.

The key concept is **intercalation**: Li+ ions insert into the crystal structure of the electrodes without permanently changing the host lattice. This is what gives Li-ion cells high energy density and long cycle life compared to older chemistries.

---

## The Electrodes — Materials and Trade-Offs

### Anode

- **Graphite** is the default. It is cheap, stable, and well understood.
- **Silicon-graphite blends** offer higher capacity (silicon holds ~10x more Li than graphite) but expand dramatically during charge and crack over time. Most EV cells today use 5–10% silicon in the anode as a compromise.
- **LTO (Lithium Titanate)** is extremely safe and long-lived (>10,000 cycles) but has low energy density and high cost. It is used where cycle life beats energy density, such as buses and grid storage.

### Cathode

- **LCO** (Lithium Cobalt Oxide): high energy density, poor thermal stability. Used in consumer electronics, not EVs.
- **NMC** (Nickel Manganese Cobalt): the dominant EV cathode today. Higher nickel increases energy density but reduces stability.
- **NCA** (Nickel Cobalt Aluminum): high energy density; used by Tesla with tight BMS control.
- **LFP** (Lithium Iron Phosphate): lower energy density, but much better thermal safety and cycle life. No cobalt. Dominant in many budget EVs and stationary storage.
- **LMFP** (Lithium Manganese Iron Phosphate): emerging compromise — higher voltage than LFP with similar safety.

---

## Chemistry Comparison (High-Level)

| Chemistry | Nominal V | Energy Density (Wh/kg) | Cycle Life | Thermal Safety | Typical Use |
|---|---|---|---|---|---|
| LCO | 3.6 V | 150–200 | ~500 | Low | Phones, laptops |
| NMC 532 | 3.6 V | 170–220 | 1000–2000 | Medium | Most EVs |
| NMC 811 | 3.6 V | 200–260 | 1000–1500 | Medium-Low | High-range EVs |
| NCA | 3.6 V | 200–260 | 1000–2000 | Medium-Low | Tesla |
| LFP | 3.2 V | 120–165 | 2000–4000+ | High | Budget EVs, storage |
| LTO | 2.4 V | 60–80 | >10,000 | Very High | Buses, grid |

---

## Cell Formats — Physical Packaging

### Cylindrical
Named by diameter x length: 18650, 21700, 4680.

- **Pros**: mature manufacturing, strong metal can, consistent quality
- **Cons**: gaps between cells waste volume, requires many cells in parallel for high current

### Prismatic
Rectangular metal can, large capacity per cell.

- **Pros**: space-efficient packing, good thermal contact on flat faces
- **Cons**: swelling must be managed with compression hardware

### Pouch
Flexible laminated foil enclosure.

- **Pros**: highest energy density, design flexibility
- **Cons**: needs external compression, can swell and rupture under abuse

### Blade (CTP)
Ultra-long prismatic LFP cells spanning the pack width (CATL blade). Eliminates the module layer for better volumetric efficiency.

---

## Reading a Cell Datasheet

Key parameters you should always look for:

- **Nominal capacity (Ah)** at a standard C-rate
- **Nominal voltage (V)**
- **Voltage window** (V_max and V_min)
- **C-rate limits** (charge and discharge)
- **Energy density** (Wh/kg and Wh/L)
- **Cycle life** (cycles to 80% SOH)
- **Internal resistance (DCIR)**
- **Operating temperature range** (charge and discharge are different)
- **Self-discharge rate**

If you cannot find DCIR and temperature limits, assume the datasheet is incomplete.

---

## Formation Cycling — How a Cell Is Born

After assembly, a cell goes through **formation**: the first slow charge cycles at the factory. This is when the **SEI (Solid Electrolyte Interphase)** forms on the anode surface. A stable SEI prevents ongoing electrolyte decomposition and is essential to long cycle life.

Formation is slow, precise, and a major cost driver. After formation, cells are graded and binned by capacity and impedance. That matching step is why pack manufacturers care about cell lot codes.

---

## What Limits a Cell’s Life

Three dominant mechanisms (covered fully in the SOH post):

- **SEI growth** reduces available lithium
- **Lithium plating** occurs at high charge rates or low temperature
- **Particle cracking** from mechanical stress (especially high-silicon anodes)

The cell’s chemistry and design set the aging trajectory; the BMS can only slow it down.

---

## Takeaways

- The cell is the foundation. Everything else in a battery system exists to protect it.
- Chemistry choice (NMC vs LFP) is a system-level tradeoff: energy density vs safety and cost.
- Format choice (cylindrical vs prismatic vs pouch) shapes pack design, thermal management, and manufacturability.

---

## Experiments

### Experiment 1: OCV–SOC Curve by Chemistry
**Materials**: 1x NMC 18650, 1x LFP 18650, charger/discharger, DMM, Arduino + INA219.

**Procedure**:
1. Fully charge both cells and rest 2 hours.
2. Discharge in 10% SOC steps, rest 30 minutes each step, record OCV.
3. Plot both curves.

**What to observe**: LFP’s flat plateau vs NMC’s sloped curve.

### Experiment 2: C-Rate vs Delivered Capacity
**Materials**: 18650 NMC cell, Arduino load + INA219.

**Procedure**:
1. Discharge at C/5 to cutoff and measure Ah.
2. Repeat at 1C and 2C.
3. Plot delivered capacity vs C-rate.

**What to observe**: Higher C-rate reduces usable capacity due to IR drop.

### Experiment 3: Internal Resistance by Format
**Materials**: 18650 cylindrical, pouch or prismatic cell, fixed load.

**Procedure**:
1. Set both at 50% SOC.
2. Apply a 1 A pulse, measure delta V.
3. Compute DCIR = delta V / delta I.

**What to observe**: Pouch/prismatic often show lower DCIR per Ah.

---

## Literature Review

### Core Textbooks
- Tarascon & Armand — "Issues and challenges facing rechargeable lithium batteries" (Nature, 2001)
- Linden & Reddy — *Handbook of Batteries*
- Nazri & Pistoia — *Lithium Batteries: Science and Technology*

### Key Papers
- Goodenough & Park (2013) — Li-ion cathode development perspective
- Whittingham (2004) — cathode materials review
- Blomgren (2017) — Li-ion history and trajectory
- Zuo et al. (2017) — silicon anodes review

### Online Resources / Datasheets
- Battery University (Li-ion series)
- Samsung INR21700-50E datasheet
- Panasonic NCR18650B datasheet
- IEC 62660-1 and UN 38.3 test standards

# Deep Discharge Protection — Blog Plan

## Goal
Explain what happens to a Li-ion cell when it is discharged too deeply, why the damage is permanent, how the BMS detects and prevents it, and how recovery charging works — from "dead phone that won't turn on" analogy to copper dissolution chemistry.

## Audience Angles
- **Engineers / students**: Copper current collector dissolution mechanism, UV threshold design, recovery pre-charge algorithm
- **EV enthusiasts**: "My EV sat unused for months and now won't charge — what happened?", why you shouldn't let an EV battery hit zero

---

## Subtopic Flow

### 1. Hook — The Battery That Won't Wake Up
- Everyone has experienced leaving a phone uncharged for too long — it won't turn on, and sometimes won't even charge
- In an EV context, this is a consequence of deep discharge — and it can be permanent
- A Li-ion cell discharged below its minimum voltage threshold suffers irreversible chemical damage
- This is not the same as SOC = 0% — it is below the safe 0% cutoff, often caused by prolonged storage or BMS failure

### 2. What is Deep Discharge?
- Normal discharge: cell voltage decreases from ~4.2V (full) to ~2.5–3.0V (empty) depending on chemistry
- Deep discharge: voltage falls below the minimum cutoff voltage (V_min), into the forbidden zone
  - NMC / NCA: V_min typically 2.5–3.0V; dangerous below 2.0V
  - LFP: V_min typically 2.5V; some tolerance down to 2.0V
  - LCO (old): V_min ~3.0V; very sensitive to deep discharge
- Self-discharge: even with no load, a cell slowly self-discharges over months — a fully charged cell stored for 1–2 years may hit deep discharge territory

### 3. What Happens Inside — The Copper Dissolution Mechanism
- Below ~2.0V: copper current collector (the thin copper foil the anode is coated on) begins to oxidize and dissolve into the electrolyte
  - Cu → Cu²⁺ + 2e⁻ (copper oxidizes at anode current collector)
- On recharge: Cu²⁺ ions can re-plate — but not uniformly — they deposit as copper dendrites
- Copper dendrites can bridge anode to cathode through the separator → internal short circuit
- This is irreversible: once copper dissolution occurs, the cell has permanent capacity loss and a potential internal short hazard
- Secondary effect: loss of the current collector means electrode material loses electrical contact — capacity drops

### 4. Other Effects at Low Voltage
- **Lithium plating reversal**: at very low discharge, metallic lithium on the anode can dissolve back into electrolyte — sounds good, but recharging may plate it unevenly again
- **SEI instability**: the protective SEI layer, stable at normal voltages, can partially dissolve at very low voltage, exposing fresh anode to electrolyte
- **Electrolyte reduction**: at low voltage, electrolyte can react with electrode materials in unusual ways, forming different SEI that may be less protective

### 5. BMS Undervoltage Protection
- BMS monitors each cell individually via AFE
- When any cell falls below V_min (the undervoltage threshold):
  1. Immediately open the main discharge contactor / disable the load
  2. Log a UV fault with cell ID, voltage, timestamp, freeze-frame data
  3. Prevent further discharge
- Threshold settings: must be above copper dissolution onset (>2.5V for NMC), but conservative enough to account for voltage recovery (IR drop)
  - Important: under high load, terminal voltage may appear low due to IR drop, but OCV is still safe
  - BMS must distinguish genuine UV from load-induced voltage sag (use debounce, or verify at reduced current)
- Recovery indicator: after UV fault, cell OCV recovery is checked — if OCV recovers to >3.0V, cell may be recoverable; if OCV stays <2.0V, likely permanent damage

### 6. Long-Term Storage and Self-Discharge
- Self-discharge rate: ~1–3% SOC per month at room temperature (higher at elevated temperature)
- A 100% charged cell left for 2+ years could self-discharge into the deep discharge zone
- Best practice for storage: 40–60% SOC (middle of capacity, least stress on electrodes)
- BMS role in parked vehicles: periodically wake up, check cell voltages, alert owner if approaching UV threshold
  - This is why EVs should not be stored for months without periodic top-up charging
- 12V auxiliary battery in an EV also supplies BMS standby power — if it dies, BMS shuts down and may allow traction pack to self-discharge unmonitored

### 7. Recovery Charging — Bringing a Deep-Discharged Cell Back
- Never fast-charge a deep-discharged cell — high current into a copper-contaminated cell risks internal short via copper dendrites
- **Recovery pre-charge protocol**:
  1. Apply very low current (C/20 to C/10) until cell reaches ~3.0V
  2. Only then transition to normal CC-CV charge
  3. Monitor temperature carefully during recovery charge — anomalous heating indicates copper dendrites and internal resistance increase
- If cell does not recover (OCV stays below 2.5V after 30 min of low-current charge, or temperature rises abnormally): cell is damaged — remove from service
- Many commercial chargers have a "recovery mode" for this purpose

### 8. Chemistry Comparison

| Chemistry | V_min (cutoff) | Copper dissolution onset | Self-discharge/month | Deep discharge tolerance |
|---|---|---|---|---|
| LCO | 3.0V | ~2.0V | ~2% | Low |
| NMC | 2.5–3.0V | ~2.0V | ~1–2% | Medium |
| NCA | 2.5V | ~2.0V | ~1% | Medium |
| LFP | 2.5V | ~2.0V | ~0.5–1% | Higher |
| LTO anode | 1.5V | N/A (no Cu dissolution at typical voltages) | ~0.5% | High |

LTO is particularly robust because its nominal anode voltage keeps the Cu current collector well above the dissolution potential even at full discharge.

### 9. Takeaways
- Deep discharge is one of the most common causes of field battery failures — and it is preventable
- The damage is permanent: copper dissolution cannot be undone
- Good BMS design: tight UV monitoring, self-discharge awareness in standby, recovery charge protocol
- Enthusiasts: the "40–60% for long-term storage" rule is not myth — it is copper dissolution chemistry

---

## Experiment Ideas

### Experiment 1: Intentional Controlled Deep Discharge (Safe, Low Depth)
**Materials**: 18650 cell (sacrificial), adjustable bench power supply as load, precision DMM, Arduino logger
**Procedure**:
1. Start with fully charged cell (4.2V)
2. Discharge at C/10 rate, logging voltage vs time
3. Stop when cell reaches V_min (2.5V) — note voltage and Ah discharged
4. Let cell rest 30 min — log OCV recovery
5. (Optional, sacrificial cell only): continue discharge to 2.0V, rest, measure OCV
6. Measure capacity after recovery charge — compare to initial capacity

**Safety note**: Discharge to 2.0V on a single sacrificial cell in a ventilated area. Stop immediately if temperature rises or cell swells.

**What to observe**: OCV recovery dynamics. Capacity loss after deep discharge. Voltage plateau changes.

### Experiment 2: Self-Discharge Rate Measurement
**Materials**: 4–5 identical 18650 cells charged to 100%, precision voltmeter, temperature-controlled environment
**Procedure**:
1. Fully charge all cells, measure and record OCV immediately
2. Store at room temperature
3. Measure OCV weekly for 8 weeks
4. Plot OCV vs time for each cell, calculate self-discharge rate (mV/day, %SOC/month)

**What to observe**: Cell-to-cell variation in self-discharge rate. Temperature effect if cells stored at different temperatures. Long-term, which cells would reach deep discharge first.

### Experiment 3: Recovery Charge Protocol Demo
**Materials**: Lab power supply (current-limited), Arduino logger, a lightly deep-discharged cell (2.0–2.5V)
**Procedure**:
1. Discharge a cell to ~2.2V (controlled, low depth)
2. Apply C/20 recovery charge, log voltage and temperature at 30s intervals
3. Once cell reaches 3.0V, switch to normal CC-CV profile
4. Measure final capacity vs a non-deep-discharged control cell

**What to observe**: Voltage recovery curve shape during recovery charge. Temperature behavior. Remaining capacity after recovery vs control.

---

## Literature Review

### Core Textbooks
- **Linden & Reddy** — *Handbook of Batteries* — copper current collector behavior, over-discharge sections
- **Aurbach, D. et al.** — multiple papers on anode/electrolyte interface and failure mechanisms at low voltage

### Key Papers
- **Arora, P. et al.** (1998) — "Capacity Fade Mechanisms and Side Reactions in Lithium-Ion Batteries" — *J. Electrochemical Society* 145(10) — comprehensive degradation review including deep discharge effects
- **Maleki, H. & Howard, J.N.** (2006) — "Effects of overdischarge on performance and thermal stability of a Li-ion cell" — *J. Power Sources* 160(2)
- **Tarascon, J.M. & Armand, M.** (2001) — "Issues and challenges facing rechargeable lithium batteries" — *Nature* 414 — accessible review of Li-ion fundamentals including failure modes
- **Guo, R. et al.** (2016) — "Mechanisms of capacity degradation in nickel-rich NMC cathode materials" — *J. Materials Chemistry A*

### Online Resources
- Battery University — "BU-802b: What Does Elevated Self-Discharge Do?" and "BU-808: How to Prolong Lithium-based Batteries"
- Electrek — Articles on EV battery degradation and storage recommendations
- InsideEVs — Real-world reports of EV battery issues from improper long-term storage
- DIYElectricCar forum — threads on battery recovery procedures from deep discharge

### Standards / Application Notes
- IEC 62133 — Safety requirements for portable sealed secondary Li-ion cells — includes over-discharge testing
- TI Application Note SLUA961 — "Charging Considerations for Lithium-Ion Batteries at Low Voltage" — recovery charge circuit design
- Molicel / Samsung SDI cell datasheets — explicit over-discharge test results and minimum voltage ratings

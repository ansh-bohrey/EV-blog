# Open Circuit Voltage (OCV) vs Terminal Voltage Logic — Blog Plan

## Goal
Explain the difference between OCV and terminal voltage, why this distinction is foundational to SOC estimation and BMS design, and how the BMS handles this gap — from garden hose analogy to Thevenin equivalent circuit model.

## Audience Angles
- **Engineers / students**: Thevenin model, internal resistance, voltage relaxation dynamics, hysteresis in LFP cells, SOC estimation implications
- **EV enthusiasts**: "Why does my battery show 50% but can't output full power?", why you get different voltage readings at rest vs under load

---

## Subtopic Flow

### 1. Hook — Two Voltages, One Battery
- Measure a battery cell with a multimeter: 3.85V. Start pulling current from it: voltage immediately drops to 3.60V. Stop pulling current: voltage climbs back to 3.82V over the next hour.
- Which is the "true" voltage? And which one matters for the BMS?
- The answer depends on what you are using it for — and understanding the difference is foundational to BMS design.

### 2. Definitions
- **Open Circuit Voltage (OCV)**: the terminal voltage of a cell measured with zero current flowing, after sufficient rest time for the cell to reach electrochemical equilibrium
  - OCV reflects the cell's actual state of charge via the thermodynamic equilibrium potential
  - OCV requires: no current for typically 30 min to 2h (chemistry-dependent) — longer for LFP, shorter for NMC
- **Terminal Voltage (V_T)**: the voltage measured at the cell terminals during current flow (charge or discharge)
  - V_T = OCV - I × R_internal (simplified) for discharge (voltage drops below OCV)
  - V_T = OCV + I × R_internal for charge (voltage rises above OCV)
- The key equation: **V_T = OCV - I × R_total** (where R_total captures all resistive and reactive losses)

### 3. Where Does the Voltage Drop Go? — The Physics
- **Ohmic (resistive) drop**: immediate — proportional to current, due to electrolyte resistance, contact resistance, SEI resistance. Appears instantly.
- **Charge transfer overpotential**: slightly slower — related to kinetics of the Li-ion transfer across the electrode/electrolyte interface
- **Diffusion overpotential**: slow — concentration gradient of Li-ions within the electrode particles; dominates at high C-rate or after sustained load
- Total: these sum to create the IR drop between OCV and terminal voltage
- Relaxation: when current stops, voltage does not instantly return to OCV — it "relaxes" as concentration gradients equalize. The slow portion can take hours (especially in LFP).

### 4. The Equivalent Circuit Model (ECM) — Visualizing the Gap
- Thevenin model (most common): OCV voltage source + series resistance R0 + one or more parallel RC pairs
  - R0: ohmic resistance (instantaneous drop)
  - RC pair (R1‖C1): captures charge transfer and short-term diffusion relaxation
  - Second RC pair for longer diffusion dynamics
- Show circuit diagram with labels
- Each component has value that depends on SOC and temperature
- This model is the backbone of most production BMS SOC and SOP estimators

### 5. Hysteresis — The Complication in LFP
- In LFP (and some other chemistries): OCV after charging is measurably different from OCV after discharging at the same SOC
- This is OCV hysteresis — a fundamental thermodynamic property of the phase-transition lithiation mechanism in LFP
- Consequence: using a single OCV-SOC curve gives wrong answer depending on whether cell was last charging or discharging
- Solution: use separate charge and discharge OCV curves with interpolation based on current history, or model-based hysteresis tracking
- This is one of the major reasons LFP SOC estimation is harder than NMC

### 6. Practical Implications for SOC Estimation
- OCV-based SOC (most accurate) requires the cell to be at rest long enough to equilibrate
- Not available during driving — must use Coulomb counting or model-based estimation during operation
- At key-off: BMS waits for voltage relaxation, then takes an OCV-based SOC fix after sufficient rest time (similar to GPS landmark fix after dead reckoning)
- Temperature affects OCV: OCV shifts slightly with temperature — BMS must use temperature-compensated OCV-SOC curves
- Voltage sag at high current (especially cold battery) means terminal voltage hits the cutoff limit before OCV does → premature apparent empty

### 7. What the BMS Does in Practice
- **During operation**: use Coulomb counting + model-based voltage correction (EKF)
- **At startup (after rest)**: check cell voltages, if relaxation is complete, use OCV lookup to initialize SOC — this is the most accurate reset opportunity
- **During charging (CV phase)**: as current tapers to near zero, terminal voltage ≈ OCV → good opportunity for SOC verification
- **Under high load**: BMS must not confuse terminal voltage sag with genuine undervoltage — use model to separate IR drop from true SOC change
- **Communication to driver**: BMS reports estimated SOC, not raw voltage — the voltage-to-SOC conversion must account for the OCV vs terminal voltage distinction

### 8. Voltage Relaxation and Startup SOC Initialization
- A cell resting for different durations shows a characteristic relaxation curve
- BMS can use the relaxation curve shape to estimate SOC even before full equilibration — pattern matching on the voltage trajectory
- Minimum rest time for reliable OCV SOC initialization:
  - NMC: ~15–30 min adequate for moderate accuracy
  - LFP: ~60–120 min due to flat OCV curve and hysteresis
- This explains why the SOC readout on some EVs changes after parking for a while — the BMS is revising its estimate as OCV settles

### 9. Measurement Sensitivity
- Why BMS needs precision voltage measurement: in the steep region of the OCV-SOC curve (NMC), 1mV error ≈ 0.5% SOC error — acceptable
- In the flat region (LFP): 1mV error ≈ 5–20% SOC error — unacceptable without current integration
- This is why AFE accuracy specification is so important (see AFE post) and why LFP packs lean more heavily on Coulomb counting

### 10. Takeaways
- OCV is the "true" battery voltage; terminal voltage is what you measure under real conditions
- The gap between them = IR drop = function of current, internal resistance, temperature, and time
- Good BMS: knows when it is reading OCV vs terminal voltage, and accounts for the difference in every estimation calculation
- Next: SOC estimation uses this OCV-SOC relationship as its foundation

---

## Experiment Ideas

### Experiment 1: Measure IR Drop at Different C-Rates
**Materials**: 18650 cell, precision DMM or INA219, adjustable constant-current load (resistor + MOSFET or bench electronic load), Arduino logger
**Procedure**:
1. Charge cell to 3.7V (approximately 50% SOC NMC), rest 2h, measure OCV
2. Apply 0.2A, log terminal voltage immediately and after 10s
3. Stop current, wait 5 min, measure OCV
4. Repeat at 0.5A, 1.0A, 2.0A (C/5, C/2, 1C, 2C for a typical 2Ah cell)
5. Calculate DCIR = (OCV - V_loaded) / I at each step

**What to observe**: Linear relationship between current and voltage drop. Plot terminal voltage vs current (V-I characteristic). Compute internal resistance at this SOC. Show that 2C load drops voltage significantly vs C/10.

### Experiment 2: Voltage Relaxation Curve
**Materials**: Same setup + real-time logging to laptop
**Procedure**:
1. Discharge cell at 1C for 30s, then cut load
2. Log terminal voltage every 5s for 60 minutes
3. Mark the initial fast relaxation (ohmic + charge transfer) and slow relaxation (diffusion)
4. Compare relaxation time for NMC cell vs LFP cell if both available

**What to observe**: Bi-exponential (or multi-exponential) voltage recovery. Show how long you need to wait for true OCV. Illustrate why OCV initialization at startup is only possible after sufficient rest.

### Experiment 3: OCV-SOC Curve Hysteresis (LFP)
**Materials**: LFP 18650 cell (LifePO4), precision bench charger/discharger, Arduino logger
**Procedure**:
1. Fully charge LFP cell, rest 2h, record OCV (charge OCV curve start)
2. Discharge in 5% SOC steps (by Ah), rest 30 min at each step, record OCV
3. Fully discharge, rest, begin charging in 5% steps, rest, record OCV
4. Plot both curves on same graph

**What to observe**: LFP hysteresis — charge OCV curve sits ~5–20mV above discharge OCV curve across the flat region. Demonstrates why a single OCV-SOC table is insufficient for LFP.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 1* — Ch. 3 and 4: OCV models, ECM with hysteresis, Thevenin circuit derivation
- **Newman, J. & Thomas-Alyea, K.** — *Electrochemical Systems* (3rd ed.) — thermodynamic basis for OCV and overpotentials

### Key Papers
- **Hu, X. et al.** (2012) — "A comparative study of equivalent circuit models for Li-ion batteries" — *J. Power Sources* 198 — systematic comparison of ECM models and their accuracy for OCV/terminal voltage prediction
- **Plett, G.L.** (2004) — "Extended Kalman filtering for battery management systems" — *J. Power Sources* 134(2) — includes OCV model and EKF that fuses it with Coulomb counting
- **Safari, M. & Delacourt, C.** (2011) — "Modeling of a commercial graphite/LiFePO4 cell" — *J. Electrochemical Society* — detailed LFP OCV hysteresis modeling
- **Dubarry, M. et al.** (2009) — "Identifying battery aging mechanisms in large format Li-ion cells" — *J. Power Sources* 196 — OCV curve shape changes with aging

### Online Resources
- Battery University — "BU-902: How to Measure Internal Resistance"
- Orion BMS documentation — explanation of how OCV-based SOC initialization works at startup
- TI Application Report SLUA902 — "Battery State of Charge Estimation Using the Thevenin Equivalent Circuit"
- Plett's Supplementary Materials (available on his university page) — MATLAB code for ECM fitting

### Application Notes
- TI BQ34z100-G1 Technical Reference — how OCV table is stored and interpolated in a commercial fuel gauge IC
- Analog Devices AN-1177 — "Monitoring Li-Ion Battery Parameters in a Battery Pack"

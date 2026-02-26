# OCV vs Terminal Voltage — The Gap the BMS Lives In

*Prerequisites: [Equivalent Circuit Model Primer →](../intro/equivalent-circuit-model.md)*
*Next: [State of Charge (SOC) →](./state-of-charge-soc.md)*

---

## Two Voltages, One Battery

Take a lithium-ion cell and measure it with a multimeter: 3.85 V. Now draw 2 A from it. The reading drops to 3.60 V immediately. Cut the current. Over the next hour the voltage climbs back to 3.82 V and stays there.

Which number is the "real" voltage? The answer depends entirely on what you are trying to do with it — and understanding the difference between these two numbers is foundational to almost every algorithm a BMS runs.

The first number, measured at rest after the cell has had time to settle, is the **Open Circuit Voltage (OCV)**. The second, measured while current is flowing, is the **terminal voltage**. They describe the same cell at the same state of charge, but they are not equal, and confusing them produces wrong SOC estimates, premature cutoffs, and poor power predictions.

---

## Definitions

**Open Circuit Voltage (OCV)** is the voltage measured at the cell terminals when zero current is flowing *and* the cell has reached electrochemical equilibrium — meaning all internal concentration gradients have equalized. This requires:

- No current for a rest period that depends on chemistry: typically 15–30 minutes for NMC at moderate temperatures, and 1–2 hours for LFP (illustrative; actual rest depends on prior current magnitude, SOC, and temperature — Plett 2015, Vol. 1 Ch. 3)
- Stable temperature (temperature shifts OCV slightly)
- Prior load history considered — OCV is path-dependent in some chemistries (see LFP Hysteresis below)

OCV is the battery's thermodynamic equilibrium potential. It reflects the actual state of charge via the well-characterised OCV–SOC relationship for each chemistry.

**Terminal voltage (V_T)** is what you measure at the cell terminals *while current is flowing*. It deviates from OCV in both directions:

- During **discharge**: V_T = OCV − I × R_total (voltage is lower than OCV)
- During **charge**: V_T = OCV + I × R_total (voltage is higher than OCV)

Where R_total captures all the loss mechanisms inside the cell. The gap between OCV and terminal voltage is the **IR drop**, and it is not a fixed number — it depends on current magnitude, temperature, state of charge, and even how long the current has been flowing.

---

## Where the Voltage Drop Goes

The IR drop has three components, each operating on a different time scale.

**Ohmic drop** is instantaneous. The moment current flows, voltage shifts by I × R₀, where R₀ is the cell's ohmic resistance: electrolyte ionic resistance, contact resistance at the current collectors, and resistance through the SEI layer on the anode. If you log voltage at millisecond resolution when you apply or remove a load, you see this component as a vertical step.

**Charge transfer overpotential** is slower — settling over tens of milliseconds to a few seconds. It represents the energy barrier for lithium ions to cross the electrode–electrolyte interface. At high current rates, this barrier becomes significant.

**Diffusion overpotential** is the slowest component, evolving over seconds to minutes under sustained load. It arises from concentration gradients of lithium ions within the electrode particles themselves. When you discharge at 2C for ten minutes, the lithium concentration near the surface of each graphite particle is lower than the concentration at the core. The voltage the cell presents reflects this gradient, not the bulk state.

When current stops, voltage does not jump instantly back to OCV. It **relaxes** — first quickly (ohmic recovery is immediate, charge transfer settles in seconds), then slowly (concentration gradients take minutes to hours to equalise). The slow tail of this relaxation is why LFP cells need up to two hours of rest before their OCV is trustworthy.

---

## The Equivalent Circuit Model — Visualising the Gap

The Thevenin equivalent circuit model captures all three components in a practical circuit representation.

![Thevenin equivalent circuit: OCV source + R0 + two RC pairs](../assets/claude_assetsplan/bms-concepts/thevenin-circuit.svg)

The circuit has:
- An **OCV voltage source** — the equilibrium potential, a function of SOC and temperature
- **R₀** — the series ohmic resistance (instantaneous voltage drop)
- **R₁‖C₁** — a parallel RC pair capturing charge transfer dynamics (tens of milliseconds to seconds)
- **R₂‖C₂** — a second RC pair capturing diffusion dynamics (seconds to minutes)

Every component value depends on SOC, temperature, and SOH. At low temperature, R₀ can triple. At low SOC, diffusion overpotential becomes dominant. At end of life, all resistances are larger.

This model is not an academic exercise. It is the backbone of production BMS SOC and SOP estimators. The BMS maintains a running estimate of the state of each RC pair, uses it to predict terminal voltage under load, and corrects its SOC estimate based on the difference between predicted and measured voltage. More on this in the [SOC post](./state-of-charge-soc.md).

<iframe src="../assets/claude_assetsplan/bms-concepts/ocv-terminal-voltage-animation.html" width="100%" height="400" frameborder="0"></iframe>

---

## LFP Hysteresis — The Complication

Most OCV discussions assume a single OCV–SOC curve. For NMC, that is adequate. For **LFP (LiFePO₄)**, it is not.

LFP's phase-transition lithiation mechanism produces a measurable difference between the OCV you get after charging to a given SOC and the OCV you get after discharging to the same SOC. The charge-side OCV curve sits roughly 5–20 mV above the discharge-side curve across the flat voltage plateau (Safari & Delacourt 2011 — see Further Reading; magnitude varies by cell and SOC). This is OCV **hysteresis**.

![LFP OCV hysteresis: charge OCV curve vs discharge OCV curve across the SOC range](../assets/claude_assetsplan/bms-concepts/lfp-hysteresis.svg)

The practical consequence: if your BMS uses a single OCV–SOC lookup table, it will give the wrong SOC answer every time the cell transitions between charging and discharging. For a chemistry whose entire plateau spans only ~100 mV, a 20 mV hysteresis is not a rounding error.

Good BMS implementations for LFP maintain two OCV tables — one for the charge path, one for the discharge path — and blend between them based on recent current history, or explicitly model hysteresis state as an additional variable. This is one of the main reasons LFP SOC estimation is harder than NMC, despite LFP's other advantages.

---

## Practical Implications for SOC Estimation

The OCV–SOC relationship is the most accurate foundation for SOC estimation — but only when the cell is actually at equilibrium. This creates a fundamental constraint: **OCV-based SOC is unavailable during vehicle operation**.

While the vehicle is moving, the BMS must use other methods:

- **Coulomb counting** integrates current over time to track SOC changes from a known starting point
- **Model-based correction (EKF/EKF)** uses the Thevenin model to predict terminal voltage, compares to measured voltage, and adjusts SOC to reduce the error

At **key-off**, the BMS waits for voltage relaxation. After sufficient rest, it reads OCV and uses it to "re-anchor" the SOC estimate — similar to a GPS fix after dead reckoning. This is why the displayed SOC on some EVs changes by a few percent after the car has been parked overnight: the BMS was correcting its estimate as OCV settled.

The **CV phase of charging** provides another OCV-adjacent opportunity: as charge current tapers toward zero, terminal voltage asymptotically approaches OCV. The BMS can use this to verify SOC near full charge.

**Voltage sag at high current** creates a related trap. Under a heavy acceleration load, terminal voltage may drop close to V_min not because the cell is truly empty but because the IR drop is large. A BMS that mistakes load-induced sag for genuine undervoltage will cut power prematurely — the cold-weather sluggishness that many EV owners have experienced. The solution is to model the expected IR drop given current and temperature, and only act on the estimated OCV, not the raw terminal voltage.

---

## Voltage Relaxation and Startup Initialisation

When a BMS powers up after the vehicle has been parked, it faces the question: how long has the car been sitting, and is the voltage reading now reliable?

<iframe src="../assets/claude_assetsplan/bms-concepts/voltage-relaxation.html" width="100%" height="380" frameborder="0"></iframe>

The relaxation curve has a characteristic shape — fast initial recovery followed by a long slow tail. BMS firmware can use the slope and curvature of this trajectory to estimate how much further the voltage will move, allowing a reasonably accurate SOC estimate even before full equilibration. Some implementations pattern-match the relaxation trajectory to a database of known curves.

Minimum rest times for reliable OCV SOC initialisation:
- **NMC**: 15–30 minutes is adequate for moderate accuracy (±3% SOC) — illustrative; actual minimum depends on prior current and SOC
- **LFP**: 60–120 minutes, and even then hysteresis adds uncertainty (see Safari & Delacourt 2011)

The flat OCV–SOC curve of LFP is the other side of the estimation difficulty: in the plateau region, a 1 mV measurement error maps to roughly 1–5% SOC error (derived from published LFP OCV-SOC curves where the plateau slope is typically 0.2–1 mV/%SOC; actual value is cell- and SOC-dependent — see Safari & Delacourt 2011 in Further Reading). This is why AFE measurement accuracy is not just a spec-sheet number — it directly determines whether LFP SOC estimation is practical at all. See the [AFE post](./analog-front-end-afe.md) for how precision voltage measurement is achieved in hardware.

---

## What the BMS Does in Practice

Putting it together: the BMS manages OCV and terminal voltage by knowing which regime it is in and acting accordingly.

**At startup (after rest)**: read cell voltages, assess how long the car has been parked (via RTC or soak timer), decide whether relaxation is complete, and use OCV lookup to initialise SOC if it is. If uncertain, use the slope of the observed relaxation to estimate final OCV.

**During operation**: do not use raw terminal voltage for SOC. Instead, use the Thevenin model to estimate OCV continuously from measured terminal voltage, current, and temperature. Feed that estimated OCV into the SOC estimator. Run an EKF to correct drift.

**During charging (CV phase)**: as current tapers, terminal voltage converges toward OCV. Use this as a secondary SOC verification anchor, especially useful for calibrating the Coulomb counter after a full charge.

**Under high load**: monitor whether terminal voltage drop is consistent with the expected IR drop given current and temperature. Anomalous voltage drop beyond what the model predicts may indicate a cell fault, not just load.

**At key-off**: log the last OCV reading and its confidence. On next startup, that stored value gives the BMS a warm start for SOC estimation, reducing the initialisation uncertainty.

---

## Experiments

### Experiment 1: Measure IR Drop at Different C-Rates

**Materials**: 18650 NMC cell, INA219 current/voltage logger, adjustable constant-current load (resistor + MOSFET or bench electronic load), Arduino logger

**Procedure**:
1. Charge cell to approximately 50% SOC (3.7 V for NMC), rest 2 hours, record OCV
2. Apply 0.2 A, log terminal voltage immediately and after 10 s
3. Stop current, rest 5 minutes, record OCV
4. Repeat at 0.5 A, 1.0 A, 2.0 A (C/10, C/4, C/2, 1C for a 2 Ah cell)
5. Compute DCIR = (OCV − V_loaded) / I at each step

**What to observe**: Linear relationship between current and voltage drop. Plot terminal voltage vs current (V–I characteristic). Compute internal resistance at this SOC. Show that 2C load drops voltage by significantly more than C/10, and understand why this matters for SOP calculations.

---

### Experiment 2: Voltage Relaxation Curve

**Materials**: Same setup + real-time logging to laptop, stop-clock or RTC

**Procedure**:
1. Discharge cell at 1C for 30 seconds, then cut load
2. Log terminal voltage every 5 seconds for 60 minutes
3. Mark the initial fast relaxation (ohmic + charge transfer recovery) and the slow tail (diffusion)
4. If an LFP cell is available, compare relaxation time for LFP vs NMC at the same SOC

**What to observe**: Bi-exponential voltage recovery matching the two RC pairs in the Thevenin model. Observe how long it actually takes for voltage to stabilise to within 1 mV — this is the minimum rest time for reliable OCV-based SOC initialisation.

---

### Experiment 3: OCV–SOC Hysteresis in LFP

**Materials**: LFP 18650 cell (LiFePO₄), precision bench charger/discharger, Arduino logger

**Procedure**:
1. Fully charge LFP cell, rest 2 hours, record OCV (start of discharge OCV curve)
2. Discharge in 10% SOC steps (by measured Ah), rest 30 minutes at each step, record OCV
3. Fully discharge, rest, begin charging in 10% steps, rest at each, record OCV
4. Plot both curves on the same graph

**What to observe**: LFP hysteresis — the charge OCV curve sits measurably above the discharge OCV curve across the flat plateau. Understand concretely why a single OCV–SOC table gives wrong answers for LFP, and why good LFP BMS implementations carry two tables.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 1* (Artech House, 2015) — Ch. 3–4: OCV models, ECM with hysteresis, Thevenin circuit derivation. The primary reference for everything in this post.
- **Hu, X. et al.** (2012) — "A comparative study of equivalent circuit models for Li-ion batteries" — *J. Power Sources* 198 — systematic comparison of ECM accuracy for OCV and terminal voltage prediction.
- **Plett, G.L.** (2004) — "Extended Kalman filtering for battery management systems" — *J. Power Sources* 134(2) — foundational EKF paper combining OCV model with Coulomb counting.
- **Safari, M. & Delacourt, C.** (2011) — "Modeling of a commercial graphite/LiFePO4 cell" — *J. Electrochemical Society* — detailed LFP OCV hysteresis modelling.
- Battery University — "BU-902: How to Measure Internal Resistance" — accessible introduction to DCIR measurement.
- TI BQ34z100-G1 Technical Reference — how OCV table is stored and interpolated in a commercial fuel gauge IC.

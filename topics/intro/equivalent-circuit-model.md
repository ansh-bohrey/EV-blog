# Equivalent Circuit Model (ECM) Primer — Blog Plan

## Goal
Build the Thevenin equivalent circuit model of a Li-ion cell from scratch — starting from a pure voltage source and adding one component at a time — so that the SOC, SOP, and OCV vs Terminal Voltage posts all have a shared physical foundation.

## Audience Angles
- **Engineers / students**: Component-level derivation, parameter extraction via pulse test, ECM as a state-space system, how the model feeds into Kalman filter estimation
- **EV enthusiasts**: "Why does the battery voltage jump around when I press the accelerator?" — explained through the physical model without requiring circuit theory background

---

## Subtopic Flow

### 1. Hook — One Model That Explains Three Mysteries
- Mystery 1: You press the accelerator and the battery voltage instantly dips, then recovers slightly. Why?
- Mystery 2: You stop the car, and the battery voltage slowly climbs for the next hour. Why?
- Mystery 3: The BMS estimates SOC from voltage, but only when the car has been parked for a while. Why?
- One model — the Equivalent Circuit Model — explains all three. This post builds it piece by piece.

### 2. Why Model a Battery as a Circuit?
- A real battery is an electrochemical system — Li-ion intercalation, ion diffusion, SEI layers — too complex to simulate directly in a BMS microcontroller running at 1000 Hz
- An ECM replaces this complexity with a small set of electrical components (resistors, capacitors, voltage sources) that *behave the same way* at the terminals
- Not physically accurate at the atomic level — accurate enough at the terminal level for estimation, control, and protection
- The ECM is the standard model in production BMS software worldwide

### 3. Level 0 — The Ideal Voltage Source
- The simplest model: battery = voltage source whose voltage equals OCV (Open Circuit Voltage)
- V_terminal = OCV(SOC, T)
- OCV is a known function of SOC (the OCV-SOC curve from the Cell post)
- Problem: when you draw current, voltage immediately drops. This model predicts no drop. It's wrong under load.
- But: it IS correct at rest for long enough — the foundation we build on.

### 4. Level 1 — Add R₀ (Ohmic Resistance)
- Add a series resistor R₀ between the OCV source and the terminal
- V_terminal = OCV - I × R₀ (during discharge; sign convention: positive I = discharge)
- R₀ captures: electrolyte resistance, SEI resistance, contact resistance — all the "instantaneous" voltage drop
- Explains Mystery 1: press accelerator → current flows → instant voltage drop = I × R₀
- This is the **DCIR** (DC Internal Resistance) you measure with a pulse test: R₀ = ΔV / ΔI at the instant of current step
- R₀ depends on temperature (rises sharply when cold) and slightly on SOC
- Model accuracy: good for the instant of load change; still misses the slower voltage dynamics

### 5. Level 2 — Add an RC Pair (R₁ ‖ C₁)
- In reality, voltage continues to recover slowly after current changes — R₀ alone can't explain this
- Add one RC parallel combination in series with R₀
  - R₁ represents charge transfer resistance (electrode/electrolyte interface kinetics)
  - C₁ represents the electrochemical double-layer capacitance
  - Time constant τ₁ = R₁ × C₁ — typically 10s to 100s of seconds for Li-ion
- Now the model has three components: OCV source + R₀ + (R₁ ‖ C₁)
- V_terminal = OCV - I × R₀ - V_C₁(t)
- V_C₁(t) evolves as: dV_C₁/dt = -V_C₁/(R₁C₁) + I/C₁
- Explains Mystery 2: after load removed, V_C₁ decays exponentially → terminal voltage recovers toward OCV with time constant τ₁
- Show the voltage waveform: step current → instant drop (R₀) → further slow drop (RC) → current off → instant partial recovery (R₀) → slow exponential recovery (RC) → OCV

### 6. Level 3 — Two RC Pairs (Full Thevenin Model)
- One RC pair captures the dominant fast dynamics (charge transfer, ~10–100s)
- A second RC pair (R₂ ‖ C₂) captures slower diffusion dynamics (ionic concentration gradients, ~100–1000s)
- V_terminal = OCV - I × R₀ - V_C₁(t) - V_C₂(t)
- This 2RC Thevenin model is the standard in most production BMS implementations
- Diminishing returns beyond 2 RC pairs for a BMS (more parameters, more noise sensitivity)
- Show a complete circuit diagram: OCV source → R₀ → node → RC₁ in parallel → node → RC₂ in parallel → terminal
- State-space form: two state variables (V_C₁, V_C₂) plus OCV (which is a function of SOC)

### 7. How ECM Parameters Are Extracted
The ECM is only useful if its parameters (R₀, R₁, C₁, R₂, C₂) are known for your specific cell:
- **Pulse test (HPPC-style)**:
  1. Rest cell at known SOC
  2. Apply a current step (e.g., 1C for 10s)
  3. Measure voltage waveform
  4. R₀ = instantaneous ΔV / ΔI (at t=0⁺)
  5. Fit an exponential: remaining decay = V_C₁(0)×e^(−t/τ₁) + V_C₂(0)×e^(−t/τ₂)
  6. Extract R₁ = V_C₁(0)/I, τ₁ → C₁ = τ₁/R₁; similarly for R₂, C₂
- Parameters vary with SOC and temperature → build lookup tables at 5–10 SOC points × 3–5 temperatures
- This characterization is done once per cell type, then embedded in BMS firmware as a lookup table

### 8. ECM as a State Estimator Foundation
- Express the ECM as a state-space system:
  - States: [SOC, V_C₁, V_C₂]
  - Input: measured current I
  - Output: predicted terminal voltage V_terminal
  - SOC evolves via Coulomb counting: dSOC/dt = −I/(3600 × Q)
- The Kalman filter (used in SOC estimation) takes this state-space form + measurements of real V_terminal to correct the state estimates
- Without the ECM, the filter has no model to correct against — it is the heart of model-based estimation
- Link forward: the SOC post uses this model; the SOP post uses it to predict voltage headroom under hypothetical future currents

### 9. What the ECM Does NOT Capture
- **Long-term aging** (SOH changes): R₀ and C₁ change as the cell ages. The BMS must update parameters over time — this is the SOH tracking problem.
- **Lithium plating**: the ECM doesn't model the electrochemical side reaction that causes plating under fast charge at cold temperatures — a purely physics-based limitation
- **Very long-timescale diffusion** (>30 minutes): the 2RC model's slowest time constant is typically <10 minutes; very slow relaxation (LFP) may need a 3rd RC pair or a Warburg impedance element
- **Hysteresis** (especially LFP): OCV after charge ≠ OCV after discharge at same SOC — requires an additional hysteresis state in the model

### 10. Takeaways
- The ECM is a deliberate simplification — wrong in detail, right in behavior
- R₀ explains the instantaneous voltage drop; RC pairs explain why voltage keeps changing after current changes
- Every BMS SOC and SOP estimator is built on top of an ECM — understanding this model is the foundation for understanding BMS algorithms
- Next: OCV vs Terminal Voltage shows how R₀ alone creates the gap between what you measure and what the battery "really is" at that moment

---

## Experiment Ideas

### Experiment 1: See the RC Voltage Response
**Materials**: 10kΩ resistor, 1000µF capacitor, 9V battery, switch, oscilloscope or Arduino ADC logging
**Procedure**:
1. Build series RC circuit: 9V → switch → 10kΩ → 1000µF → GND
2. Close switch: log voltage across capacitor vs time (τ = RC = 10s — very observable)
3. Open switch: observe discharge through the 10kΩ resistor
4. Plot: the exponential charge and discharge shape IS the RC pair voltage response in the ECM

**What to observe**: Exponential voltage curves — the same shape as the slow recovery after a current pulse in a real battery. The time constant τ = R×C. Change R or C and show τ changes proportionally.

### Experiment 2: Extract R₀ from a Real Cell
**Materials**: 18650 cell at 50% SOC, INA219 + Arduino, 2Ω load resistor + MOSFET switch
**Procedure**:
1. Rest cell 30 min, record OCV
2. Apply 500mA load (close MOSFET) — log voltage at 10ms intervals for first 5s
3. Remove load — log voltage recovery at 10ms intervals for 5 min
4. R₀ = (OCV − V_terminal_at_t=0⁺) / 0.5A — the instantaneous drop

**What to observe**: The two-phase drop: instant (R₀) and slow (RC pairs). The slow recovery back toward OCV after load removal. If you have a fast enough ADC, you can actually see the two time constants separately in the recovery curve.

### Experiment 3: Build a Simple ECM Simulation in Python
**Materials**: Python (numpy, matplotlib), measured R₀, τ₁, τ₂ from Experiment 2
**Procedure**:
1. Implement the 2RC state-space model in Python (forward Euler integration)
2. Input: a realistic current profile (constant 1A discharge for 60s, then 0A for 120s)
3. Simulate V_terminal vs time
4. Overlay real measured V_terminal from the same current profile on a cell
5. Compare simulated vs measured

**What to observe**: How well the simple 2RC model tracks the real cell voltage. Where it deviates (typically at high SOC or high C-rate extremes). Intuition for model accuracy vs complexity trade-off.

---

## Literature Review

### Core Textbooks
- **Plett, G.L.** — *Battery Management Systems, Vol. 1: Battery Modeling* (Artech House, 2015) — Ch. 3 and 4 are the definitive treatment of ECM derivation, parameter extraction, and state-space form. Read alongside this post.
- **Linden & Reddy** — *Handbook of Batteries* — electrochemical background for understanding what each ECM component physically represents

### Key Papers
- **Hu, X. et al.** (2012) — "A comparative study of equivalent circuit models for Li-ion batteries" — *J. Power Sources* 198 — systematic comparison of 0RC, 1RC, 2RC models; shows accuracy vs complexity trade-off clearly
- **Chen, M. & Rincon-Mora, G.A.** (2006) — "Accurate electrical battery model capable of predicting runtime and I-V performance" — *IEEE Trans. Energy Conversion* 21(2) — accessible ECM derivation with experimental validation
- **Plett, G.L.** (2004) — "Extended Kalman filtering for battery management systems" — *J. Power Sources* 134(2) — shows how ECM feeds directly into EKF for SOC estimation

### Online Resources
- Gregory Plett's BMS course materials (University of Colorado) — freely available lecture slides covering ECM derivation and Kalman filtering
- MATLAB Battery Equivalent Circuit Model example (MathWorks documentation) — runnable Simulink model of a 2RC ECM with parameter extraction
- Battery University — "BU-902: How to Measure Internal Resistance" — practical measurement guidance

### Application Notes
- TI Application Report SLUA902 — "Battery State of Charge Estimation Using the Thevenin Equivalent Circuit"
- Analog Devices — "Modeling and Simulation of Lithium-Ion Batteries from a Systems Engineering Perspective" (downloadable from ADI)

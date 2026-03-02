# Charging Algorithm — Why You Cannot Just Dump Current In

*Prerequisites: [State of Charge (SOC) →](./state-of-charge-soc.md), [State of Health (SOH) →](./state-of-health-soh.md)*
*Next: [Ignition Handling →](./ignition-handling.md)*

---

## The Bucket That Can Explode

There is an appealing intuition that charging a battery is like filling a bucket — just add current until it is full, then stop. The problem is that lithium-ion cells are not buckets. Push current in faster than the anode can absorb it, and lithium deposits on the anode surface as metallic lithium instead of intercalating safely into the graphite. That metallic lithium grows into needle-shaped **dendrites** — and dendrites can puncture the separator between anode and cathode, causing an internal short circuit and thermal runaway.

The charging algorithm is the BMS's answer to this: a precise choreography of current and voltage over time that extracts maximum charging speed from the cell without crossing the electrochemical limits that cause irreversible damage. Getting it right is the difference between a battery that delivers its rated cycle life and one that degrades noticeably in the first year.

---

## The Electrochemistry of Charging

During charging, lithium ions migrate from the cathode, travel through the electrolyte, and **intercalate** — insert themselves between layers of graphite at the anode. The graphite crystal structure has a finite number of intercalation sites and a finite rate at which those sites can absorb incoming ions. This rate is governed by solid-state diffusion: how quickly lithium can diffuse through the existing intercalated graphite to make room for the next ion.

When the applied charge current exceeds the anode's acceptance rate — either because the rate itself is high, or because diffusion has slowed — lithium ions arrive faster than they can intercalate. The excess deposits directly on the anode surface as **metallic lithium**. Unlike intercalated lithium, this metallic lithium is not recoverable: it reacts with the electrolyte, forming additional SEI material and permanently consuming both lithium and electrolyte. Some deposits grow into dendrites.

Two conditions dramatically worsen this situation. **Cold temperature** slows ion diffusion in the electrolyte and solid-state diffusion in the graphite — the same current that was safe at 25 °C can cause plating at 5 °C. **High SOC** means the graphite is already nearly full, leaving fewer vacant intercalation sites — the anode acceptance rate drops as it approaches saturation, and the risk of plating rises sharply above roughly 80% SOC.

This is the physical foundation for everything that follows.

---

## CC-CV — The Standard Protocol

The charging algorithm used in virtually every production lithium-ion charger is **Constant Current – Constant Voltage (CC-CV)**. Its shape is elegant precisely because it respects the cell's own physics rather than fighting against it.

<iframe src="../../assets/bms-concepts/cc-cv-charge-profile.html" width="100%" height="380" frameborder="0" loading="lazy"></iframe>

**CC phase**: The charger delivers a fixed current — typically 0.5C to 1C for standard charging, up to 3–4C for DC fast charging — while the cell voltage rises steadily from its resting value. The voltage rise reflects the increasing SOC (via the OCV-SOC relationship) plus the resistive and dynamic voltage drops across R₀ and the RC network of the Thevenin equivalent. Most of the cell's capacity — typically 70–80% — is delivered during this phase. The CC phase continues until the cell voltage reaches its maximum permitted value: 4.2 V for most NMC chemistries, 4.35 V for NMC811, 3.65 V for LFP.

**CV phase**: The charger switches to holding voltage constant at V_max and allows the current to taper naturally. As the cell fills, the concentration gradients driving lithium transport equilibrate, and the current demand from the cell decreases. The CV phase is complete when the current drops below a termination threshold — typically C/20 or C/10. This phase safely tops off the remaining 20–30% of capacity.

The elegance of CC-CV is in what it accomplishes automatically: the transition from CC to CV is triggered by the cell's own voltage reaching V_max, and the current tapering in CV is driven by the cell's own electrochemical state. The charger does not need to model what is happening inside — the cell tells it when to slow down.

---

## Why Fast Charging Slows After 80%

Every EV fast-charger UI shows the same pattern: full charging speed to roughly 80%, then a gradual slowdown to 100%. This is not a charger limitation, a software restriction, or a marketing choice. It is the CC-to-CV transition made visible.

At approximately 80% SOC, the cell voltage reaches V_max. The CC phase ends. The charger transitions to CV, and the current begins tapering. Since power equals voltage times current, and the voltage is now held constant while current falls, charging power drops. The rate at which current tapers — and therefore the rate at which the last 20% is added — is governed by the cell's internal diffusion dynamics, not the charger's hardware capability.

Pushing more current at this point would require exceeding V_max, which would trigger OV protection at the cell level. Even if you bypassed the protection, forcing current above what the cell can accept at high SOC causes exactly the lithium plating described above. The slowdown is physics. The smart approach is to plan the trip around it: arrive at 10–20% SOC, charge to 80%, and leave. The 20–80% window is where fast charging genuinely fast.

---

## Temperature-Adaptive Charging

Temperature is the single most important variable in charging decisions. The BMS applies a **derating factor** to the maximum charge current based on real-time temperature readings from the pack thermistors, following a profile roughly like this:

| Temperature range | Maximum charge rate | Reason |
|---|---|---|
| Below 0 °C | Severely limited or stopped | Severe lithium plating risk |
| 0–15 °C | Reduced (e.g., C/4 instead of 1C) | Reduced diffusion rate |
| 15–45 °C | Normal rated rate | Safe operating window |
| Above 45 °C | Reduced; prioritise cooling | Accelerated SEI growth |
| Above 60 °C | Stopped | Thermal runaway risk |

*Temperature thresholds and example rates in this table are illustrative; actual values are OEM-defined and vary by cell chemistry and vehicle platform.*

At sub-zero temperatures, ion diffusion in the electrolyte slows enough that even moderate charge currents can cause plating. Many BMS implementations stop charging entirely below 0 °C, or allow only a trickle current to pre-warm the pack. Some production EVs manage this proactively: the BMS activates **thermal preconditioning** before arriving at a DC fast charger, using resistive heaters or the heat pump to bring the pack above 15 °C so that the full charge rate is available immediately.

Above 45 °C, the concern shifts from plating to SEI growth. Elevated temperature accelerates the side reactions that consume active lithium and electrolyte, degrading SOH. The BMS reduces charge current and prioritises cooling to keep the pack in the safe window.

The cold-temperature behaviour is the direct explanation for why charging takes longer in winter. The car is not being conservative out of caution — it is applying the derating table above, and at 5 °C the table says C/4. That is not a bug.

---

## Charging Rate and Long-Term Health

The relationship between charging speed and battery degradation is real, measured, and quantified in the research literature.

Lower C-rates reduce lithium plating risk because the incoming current never exceeds the anode's acceptance rate. The cell completes more cycles before capacity fade becomes significant. This is the physical basis for the common recommendation to use Level 2 AC charging (typically 7–11 kW, C/3 to C/2 for most EV packs) for daily use rather than DC fast charging.

**Attia et al. (2020)** in *Nature* demonstrated that the CC-CV protocol is not a physical optimum — it is simply a convenient engineering choice. Using machine learning to search the space of possible charge profiles, they found non-CC-CV protocols that could charge cells to 80% in under 10 minutes with significantly less capacity fade per cycle than CC-CV at the same speed. The key insight: distributing stress differently over the CC phase, rather than applying uniform current, can reduce peak anode stress even at the same average rate.

For EV enthusiasts: occasional DC fast charging is fine. A battery designed for 1000 cycles of CC-CV at 1C will not fail after a few DC fast-charge sessions. What degrades batteries faster is a pattern of *daily* 150 kW charging combined with frequent charging to 100% SOC. The degradation is cumulative and measurable, but most modern EV batteries are robust enough that occasional fast charging has negligible practical impact.

---

## Multi-Stage and Advanced Charging

Several variations on CC-CV are used in production and research to improve the speed-health trade-off.

**Multi-stage CC-CV** uses two or more CC steps with decreasing rates. A typical profile: 1C from 10% to 70% SOC, then 0.5C from 70% to 90%, then CV to 100%. The reduced rate in the 70–90% range limits plating risk in the region where the anode is most constrained, while the full 1C rate in the 10–70% range maintains speed where risk is lower. The transition between CC stages is SOC-triggered, requiring accurate SOC estimation to execute — another reason SOC accuracy matters upstream.

**Pulse charging** alternates charge pulses with short rest periods. During the rest, concentration gradients in the electrolyte and graphite partially equilibrate, allowing the next pulse to be accepted more easily. Proponents claim faster average charge rates with less plating. The evidence is mixed — gains are modest and chemistry-dependent — but pulse charging is commercially deployed in some portable electronics chargers.

**Upper voltage limit reduction** is the simplest health-preserving modification: charge to 4.15 V (roughly 95% SOC) or 4.05 V (roughly 85% SOC) instead of 4.2 V. The cathode spends less time in its most oxidised, structurally stressed state. This reduces cathode cracking and SEI growth at the anode. Many BMS implementations expose this as a user-configurable charge limit, allowing daily charging to 80% and full charging for long trips.

---

## Upper Voltage Limit and Partial Charging

The decision to charge to 80% or 100% is one of the most impactful choices an EV owner makes for long-term battery health — and it is entirely a BMS feature, not a fundamental limitation of the chemistry.

At high SOC, the cathode is in its most oxidised state. NMC cathode materials under mechanical stress from the lithium extraction process develop micro-cracks in the particle structure, exposing fresh surfaces to the electrolyte, which triggers additional side reactions. Keeping the cell below 90% SOC for most of its life reduces the time spent in this high-stress state.

The BMS implements the charge limit as a target SOC ceiling. The algorithm proceeds normally — CC phase until V_max for the target SOC is reached, then CV to a current termination threshold that corresponds to the target — but the V_max is set lower than the absolute maximum the chemistry allows. At 80% target SOC for NMC, the CV phase ends at approximately 4.05–4.1 V rather than 4.2 V.

A practical implication: the range available on an 80% charge is not 80% of maximum range — it is closer to 70%, because the BMS already withholds approximately 10% at the bottom of the SOC window for deep-discharge protection. Charging from the BMS floor (roughly 10% electrochemical SOC) to 80% accesses about 70% of the physical cell capacity.

---

## Charger–BMS Communication

The BMS is always the authority on what charging current is acceptable. The communication protocols between charger and BMS implement this hierarchy.

**AC Level 1/2 (J1772 / IEC Type 2)**: The charging station encodes its maximum available current as a PWM duty cycle on the pilot signal wire in the connector (per SAE J1772 Table 1 — cited in Further Reading). 16% duty = 10 A, 25% duty = 16 A, 50% duty = 32 A. The vehicle's onboard charger reads this signal and knows the maximum it can draw. The BMS then controls the onboard charger's actual current setpoint — which may be lower than the maximum available, based on temperature, SOC, or health limits.

**DC fast charging — CHAdeMO**: CAN bus messages over an isolated CAN channel in the connector. The BMS sends its target charge voltage and maximum current request every 100 ms. The charger responds with its available output. The BMS monitors every cell during the session and can reduce its current request — or send an immediate stop command — at any point if any cell approaches a limit. The charger obeys.

**DC fast charging — CCS Combo**: uses ISO 15118 Power Line Communication (PLC) for the initial handshake and contract negotiation, followed by a dynamic control loop equivalent to CHAdeMO's CAN exchange. The additional ISO 15118 layer enables smart charging features: the vehicle can communicate its state of charge, health, and charging preferences to grid management systems.

In all cases, the BMS can reduce or halt charging faster than the charger can respond independently. The charger supplies power; the BMS decides how much of it the cells receive.

---

## Charging Safety

Charging is the operating mode with the highest overcharge risk, and the BMS monitors more aggressively during this period than during driving.

Every cell voltage is monitored individually — not just the pack terminal voltage. A single weak cell in a 96S series string will reach its V_max while the pack voltage still reads well below the pack-level OV threshold. Only per-cell monitoring catches this. The BMS stops charging immediately if any cell exceeds its OV threshold, regardless of the pack-level state.

For cells discharged below approximately 3.0 V — deep discharge that damages the SEI and leaves metallic lithium deposits — the BMS applies a **pre-charge protocol**: charge at C/20 or lower until the cell recovers to approximately 3.0 V, then transition to normal CC-CV. Applying full charge current to a deeply discharged cell stresses already-compromised electrode structures and can trigger thermal events.

**Insulation monitoring** — measuring the resistance between the HV bus and chassis ground — remains active during charging. A degraded cable, a wet connector, or a hairline crack in a cell case can create a ground fault path. The BMS detects the fault, stops charging, and logs a fault event. This is a safety function required by both AIS-004 (for Indian market) and UN ECE R100.

---

## Experiments

### Experiment 1: Log a Complete CC-CV Cycle

**Materials**: Bench power supply with CC-CV mode (e.g., Korad KA3005P or similar), 18650 NMC cell, INA219 current sensor module, Arduino Uno, laptop with serial logging.

**Procedure**:

1. Discharge cell to 3.0 V at C/5 to establish a known starting point. Rest 30 minutes.
2. Set bench supply to CC = 0.5 A (approximately 0.17C for a 3 Ah cell), CV = 4.20 V, current cutoff = 50 mA.
3. Connect INA219 in series with the cell. Log V_cell and I_charge every 5 seconds to a CSV file.
4. Plot V(t) and I(t) on the same time axis after the cycle completes.
5. Numerically integrate the current in each phase to compute Ah delivered in CC versus CV.

**What to observe**: The characteristic CC-CV signature: voltage rising at a roughly constant rate during CC, then flat; current flat during CC, then decaying exponentially during CV. Measure what fraction of total capacity arrived in the CC phase — it should be 70–80% for 0.5C. Repeat at 1C: the CC phase ends earlier (cell voltage hits 4.2 V sooner, at lower actual SOC, due to larger IR drop) and the CV phase is longer. This is the empirical demonstration of why higher C-rates apparently deliver less energy in the CC phase.

---

### Experiment 2: Temperature vs Charging Behaviour

**Materials**: Same CC-CV setup, thermistor taped to the cell, zip-lock bag and ice-water bath for cooling, hair dryer for warming.

**Procedure**:

1. Log a complete CC-CV cycle at room temperature (approximately 23 °C). Record time to 80% SOC (CC phase end), total charge time, and total Ah.
2. Cool the cell to approximately 10 °C using the ice-water bath. Dry thoroughly. Charge again at the same 0.5 A CC current. Log the profile.
3. Observe that at 10 °C, the cell voltage rises faster — it reaches 4.2 V earlier in the cycle because the internal resistance is higher at lower temperature. The CC phase is shorter; less capacity is delivered before transitioning to CV.
4. Reduce the charge current to 0.15 A (approximately C/20) and repeat at 10 °C. Compare the profile.

**What to observe**: Cold temperature causes the IR-inflated terminal voltage to hit V_max prematurely, ending the CC phase before the cell is fully charged via Coulomb counting. The reduced C-rate at cold temperatures compensates for this — the smaller IR drop means the CC phase runs longer before hitting V_max. This experiment makes the BMS temperature-derating logic tangible: it is not just about plating prevention; it is about delivering usable capacity at all.

---

### Experiment 3: Partial Charge to 80% vs 100%

**Materials**: Same setup.

**Procedure**:

1. Fully charge cell to 4.2 V using CC-CV. Record total time and total Ah.
2. Discharge back to 3.0 V. Rest.
3. Set CV target to 4.10 V (approximately 90–92% SOC for NMC). Charge to this limit. Record time and Ah.
4. Discharge back to 3.0 V. Rest.
5. Set CV target to 4.05 V (approximately 85% SOC). Charge and record.
6. Compare the three charge profiles: time saved, Ah stored, and the shape of the CV taper at each limit.

**What to observe**: Charging to 80–85% instead of 100% saves measurable time — the CV phase at high limits is long and delivers diminishing capacity. The OCV at the end of each partial charge gives a direct reading of what electrochemical SOC was actually reached. Relate the upper voltage limit to the SOH post's discussion of cathode stress at high SOC — this experiment provides the quantitative context for why the BMS offers an 80% daily charge setting and why it is worth using.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 1* (Artech House, 2015) — Chapters 4–5 cover CC-CV fundamentals, the electrochemical basis for charging limits, and the BMS charge control algorithm in detail.
- **Attia, P.M. et al.** (2020) — "Closed-loop optimization of fast-charging protocols for batteries with machine learning" — *Nature* 578, 397–402 — landmark result showing that ML-optimised charge profiles can substantially outperform CC-CV on cycle life at comparable speed. Full text available free via PMC.
- **Zhang, S.S.** (2006) — "The effect of the charging protocol on the cycle life of a Li-ion battery" — *Journal of Power Sources* 161(2), 1385–1391 — foundational empirical work quantifying how CC rate and upper voltage limit affect cycle life degradation.
- **Notten, P.H.L. et al.** (2005) — "Boostcharging Li-ion batteries: A challenging new charging concept" — *Journal of Power Sources* 145(1) — systematic evaluation of pulse charging; the most rigorous reference for understanding what pulse charging actually delivers versus claims.
- **IEC 62196** — Plugs, socket-outlets, vehicle connectors and vehicle inlets — EV charging. Defines Type 1 and Type 2 connector physical and electrical specifications including pilot signal encoding.
- **SAE J1772** — AC Level 1 and Level 2 EV charging interface; pilot signal duty cycle encoding table is in Table 1. Free summary available on the SAE website.
- **ISO 15118** — Road vehicles — Vehicle to grid communication interface — the standard governing smart charging negotiation for CCS Combo DC fast charging. Part 2 covers the message set for dynamic charge control.
- Battery University — "BU-409: Charging Lithium-Ion" and "BU-702: How to Charge — Batteries as Energy Storage" — accessible overviews of CC-CV, temperature effects, and partial charging, well-suited for enthusiast-level reading before tackling the primary literature.
- **TI Application Note SLUA967** — "Implementing CC-CV Charging with the BQ25703A" — worked implementation of CC-CV control loop on a TI charge controller, showing the register-level control flow that corresponds to the BMS algorithm described here.

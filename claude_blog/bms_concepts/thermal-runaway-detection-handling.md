# Thermal Runaway Detection & Handling — The BMS's Last Line of Defence

*Prerequisites: [The Lithium-Ion Cell →](../battery/cell.md), [Thermal Management →](../battery/cooling.md), [Error Handling & Fault Reporting →](./error-handling-fault-reporting.md)*
*Next: [BMS During a Drive →](./bms-during-a-drive.md)*

---

## The Fire That Makes Its Own Oxygen

A petrol fire can be smothered. Cut off the oxygen and it goes out. A lithium-ion cell in thermal runaway cannot be smothered, because it does not need atmospheric oxygen. The cathode material decomposes at elevated temperature and releases oxygen directly, feeding its own combustion from the inside. A CO₂ extinguisher quenches the visible flame temporarily. The moment it clears, the cell reignites from internal heat.

This sounds alarming — and it is — but context matters enormously. A properly designed EV with a functioning BMS operating within its specified conditions almost never reaches thermal runaway. It is not a latent risk lurking in every battery pack. Thermal runaway requires multiple simultaneous protection failures. The BMS is the primary prevention layer, and preventing thermal runaway is straightforward: do not overcharge, do not over-discharge, do not allow temperatures to exceed safe limits. The BMS does all of this continuously.

But prevention is not the complete story. Detection is the secondary layer — the last opportunity for the BMS to intervene before chemistry takes over. And understanding what happens when detection succeeds (or fails) requires understanding the cascade that the BMS is trying to prevent.

---

## What Thermal Runaway Is

**Thermal runaway** is a self-sustaining, self-accelerating exothermic reaction inside the cell. Once it begins, it generates more heat than the cell can dissipate. That heat accelerates the reaction, which generates more heat, which accelerates the reaction further. The feedback loop is positive and once established it cannot be stopped by external cooling alone.

The campfire analogy is precise: a campfire, once established, generates enough heat to pyrolyse new fuel and sustain itself. Remove the external ignition source and it continues burning. Thermal runaway in a Li-ion cell is the same: once the exothermic reactions are generating heat faster than the cell loses it to its surroundings, the external temperature source is irrelevant — the cell is now its own heat source.

The early chemical cascade begins at similar temperatures across chemistries — SEI decomposition starts around 80–100°C regardless of cathode type, as it is an anode-side reaction. What differs is where the cascade becomes self-sustaining: high-nickel NMC 811 by roughly 140°C, lower-nickel NMC variants higher, and LFP not until roughly 250°C because its olivine cathode releases negligible oxygen below that temperature (see chemistry table below; Feng et al. 2018). Onset is not a sharp threshold. The reactions begin slowly well below onset and accelerate gradually until the feedback becomes self-sustaining. This gradual onset is the detection window the BMS must exploit.

Once thermal runaway is established, the temperature rise rate goes from perhaps 1°C per minute to more than 100°C per minute within seconds. The window from early onset to catastrophic failure is measured in minutes to seconds depending on the initiating cause and cell design. Earlier detection is not just better — it is exponentially more effective.

---

## The Chemistry Cascade

The cascade proceeds through distinct stages, each involving different chemical reactions. Understanding the stages explains why the detection signatures appear in the order they do and why some detection methods give earlier warning than others. (Temperature ranges below are representative for NMC-family cells at moderate SOC; actual values vary by cell design, SOC, and test method — see Feng et al. 2018 in Further Reading for ARC characterisation data.)

![Thermal runaway cascade — SEI decomposition (~80–100°C), anode/electrolyte reaction (~100–130°C), separator damage (~130–150°C), cathode O₂ release (~150–200°C for layered oxides; ~250°C+ for LFP), electrolyte combustion (>200°C) — representative for NMC cells at moderate SOC; Feng et al. 2018](../assets/claude_assetsplan/bms-concepts/thermal-runaway-cascade.svg)

**~80–100°C — SEI decomposition**: The solid-electrolyte interphase (SEI) on the graphite anode is a thin passivation layer that forms during cell formation and normally prevents the electrolyte from reacting directly with the graphite. At elevated temperatures the SEI becomes thermally unstable and begins to decompose. The decomposition is exothermic — it releases heat — and exposes fresh graphite surface directly to the electrolyte. The heat generated is initially small but it is the first step in the cascade. No gas of consequence is generated yet. Temperature measurement alone will not provide early warning at this stage unless the BMS is monitoring temperature rate-of-change closely.

**~100–130°C — Anode/electrolyte reaction**: With SEI removed, lithiated graphite reacts directly with electrolyte solvents (ethylene carbonate, dimethyl carbonate, lithium hexafluorophosphate salt). These reactions are strongly exothermic and generate significant gas: hydrogen (H₂), carbon dioxide (CO₂), carbon monoxide (CO), and hydrocarbon gases. The cell internal pressure rises. This is the first stage where gas-based detection provides a warning advantage over temperature-only sensing — CO is detectable at parts-per-million levels long before temperatures reach dangerous levels.

**~130–150°C — Separator damage**: The polyolefin separator (polyethylene or polypropylene, depending on design) begins to shrink, melt, or otherwise lose its structural integrity. The separator's function — physically preventing direct contact between anode and cathode while allowing ion transport — is compromised. The risk of internal short circuit rises sharply as separator integrity fails. An internal short is a direct resistive path between anode and cathode that generates intense local heating with no current limit — accelerating the cascade dramatically.

**~150–200°C — Cathode decomposition and oxygen release**: Layered oxide cathode materials (NMC, NCA, LCO) become thermally unstable and decompose, releasing lattice oxygen. This oxygen, generated inside the cell, is what makes Li-ion fires self-sustaining. It reacts with the flammable electrolyte solvents and with the carbon-based anode. For NMC 811 (high-nickel chemistry), cathode oxygen release begins at lower temperatures than NMC 532 or lower-nickel variants — one reason high-nickel cells require more conservative thermal management. LFP cathodes (olivine structure) do not release significant oxygen below 250–300°C — the structural basis of LFP's substantially better thermal stability.

**>200°C — Electrolyte combustion and catastrophic venting**: The electrolyte solvents combust. Internal pressure exceeds the cell's venting mechanism threshold — the burst disc or vent score opens, releasing hot gas, burning electrolyte vapour, and in severe cases molten or burning electrode material as a jet flame from the vent. Cell temperature can exceed 600–700°C for NMC cells and may exceed 1000°C if the cell is in full thermal runaway and the pack provides external fuel and oxygen.

---

## What Triggers Thermal Runaway

A battery with a functioning BMS and intact hardware should never reach thermal runaway, because each trigger requires the BMS to have already failed. Understanding the triggers is understanding what the BMS prevents.

**Overcharge**: pushing a cell above V_max causes cathode structural instability, lithium plating on the anode, and electrolyte decomposition at the cathode surface — all exothermic. Lithium plating can produce dendrites that cause internal shorts. The BMS prevents overcharge via OV protection. The AFE's hardware OV comparator is the backstop if firmware fails.

**External short circuit**: a direct short across the pack terminals delivers current limited only by the pack's internal resistance — thousands of amperes. The I²R heating is catastrophic. The BMS's overcurrent protection (OCD fault) and fast-acting HV fuses are designed to interrupt this within milliseconds. If both fail simultaneously, the pack is at risk.

**Internal short circuit**: contamination particles during manufacturing, lithium dendrites from chronic lithium plating, or separator damage from mechanical abuse can create a conducting path inside the cell. An internal short is undetectable by the BMS until its thermal or voltage signatures appear — it cannot be prevented by the BMS after it forms. This is why cell-level manufacturing quality, formation protocols, and separator design are so important: the BMS cannot compensate for a cell with an internal short.

**Mechanical abuse (crush or puncture)**: direct physical damage destroys separator integrity and creates immediate internal shorts. Crash structures, the battery enclosure, and pack mechanical design provide the primary protection. The BMS cannot prevent mechanical damage — it can only detect the resulting thermal and electrical anomalies.

**Thermal abuse (adjacent cell cascade or external heat)**: a cell that reaches thermal runaway heats its neighbours. If the pack thermal design does not adequately slow this heat transfer — thermal barriers, directed venting, module isolation — the thermal event propagates from one cell to the whole pack. This is **thermal propagation**, and preventing it is a pack design problem, not a BMS problem. The BMS detects the initial cell event and disconnects HV; preventing the cascade from spreading is the job of the mechanical and thermal pack architecture.

---

## ARC Testing: Characterising Runaway in the Lab

**Accelerating Rate Calorimetry (ARC)** is the standard lab technique for characterising cell thermal runaway. An ARC instrument places a cell in an adiabatic calorimeter — a chamber that precisely matches the calorimeter temperature to the cell's surface temperature, eliminating heat loss to the surroundings and simulating the worst-case thermal environment (a cell perfectly insulated by its neighbours in a dense pack).

The instrument heats the cell in small steps and listens for self-heating: a rate of temperature rise that exceeds what the instrument is imposing. When it detects self-heating, it stops external heating and tracks the temperature rise using its own heaters to maintain adiabatic conditions. The result is a curve of temperature vs. time showing onset temperature, the rate of temperature rise at each stage, and the maximum temperature achieved.

ARC data provides: onset temperature (where self-heating begins), the temperature at which each reaction stage begins (visible as rate changes in the dT/dt curve), total heat released, gas composition (measured by mass spectrometry on the ARC gas port), and the time from onset to catastrophic failure. OEM battery engineers use this data directly to set BMS temperature thresholds and design the pack's thermal barriers. If onset is 90°C for a particular cell lot, the BMS charge temperature cutoff must be set with enough margin below 90°C that transient thermal gradients in the pack cannot bring a cell to onset without the BMS having already intervened.

ARC characterisation of cells is required by **IEC 62619** (secondary cells in industrial applications) and referenced by **UL 9540A** (large energy storage systems). For EV packs in India, the AIS-156 type approval process includes thermal abuse testing that exercises the pack's runaway prevention and detection systems.

---

## The Detection Window: Four Stages

The BMS's ability to intervene depends entirely on how early in the cascade it detects the event. Earlier detection means more effective response. The stages are not sharply separated — they blend into each other — but the framework is useful for understanding what each detection method can actually see.

**Stage 0 — Abuse conditions**: overcharge, overcurrent, over-temperature. These are not thermal runaway — they are the precursors that lead to it if uncorrected. BMS OV, OCD, and OT protection prevent Stage 0 conditions from developing. This is where the vast majority of BMS intervention happens and where the vast majority of thermal runaway is prevented. The best detection is prevention.

**Stage 1 — Onset and early warning**: SEI decomposition has begun. The cell is generating slightly more heat than it should. Temperature is rising faster than expected given the current load. CO may be detectable if gas sensing is present. Cell voltage may show a subtle anomaly if an internal reaction is consuming lithium. This is the BMS's last chance to isolate the cell and apply cooling before the cascade becomes self-sustaining. The response window is minutes.

**Stage 2 — Thermal runaway underway**: temperature is rising rapidly. The cell is venting gas. Smoke is visible if the pack has any inspection path. Voltage is collapsing. Containment measures — HV disconnection, emergency alerts — are the appropriate response. Cooling will not stop the event at this stage. The response window is seconds to minutes for the initial cell; the pack design determines whether propagation to adjacent cells occurs.

**Stage 3 — Propagation to adjacent cells**: the affected cell is beyond saving. Thermal energy is transferring to adjacent cells. This is a physical containment problem, not a BMS problem. Fire suppression, pack isolation, emergency services. The BMS's contribution is completed — it detected and disconnected HV in Stage 1 or 2. Pack design determines the outcome from here.

---

## Detection Methods

### Temperature (NTC Thermistors)

The standard. Every BMS with thermal management has NTC thermistors measuring module temperatures. For Stage 0 and Stage 1 detection, temperature thresholds and temperature rate-of-change (dT/dt) monitoring are the primary tools.

**Limitations**: thermistors measure where they are placed. In a dense cell arrangement with one thermistor per 3–6 cells, a cell undergoing early-stage runaway at the edge of the sensor's detection radius may not register a significant temperature rise until the event is already well advanced. A cell 50 mm from the nearest thermistor in a well-thermally-coupled module may not trigger a temperature fault until it is already in Stage 2.

**Thermal fuses**: passive, non-resettable protective devices placed in series with individual cells or cell groups. If temperature exceeds the fuse rating, the circuit opens. They are a hardware backstop independent of the BMS MCU — they act even if the BMS fails. The limitation is they are single-use and require maintenance after triggering.

**Fibre-optic distributed temperature sensing**: optical fibres can measure temperature at every point along their length using Raman backscattering. A fibre routed through the pack provides essentially continuous spatial temperature resolution. It is an emerging technology in large-format stationary storage and grid applications; cost and integration complexity currently limit adoption in automotive packs.

### Voltage Anomaly Detection

A cell undergoing SEI decomposition or early electrolyte reaction may show a voltage signature — a slight deviation from the expected OCV, or an anomalous voltage drop without corresponding external current load — before its temperature rises significantly.

The BMS can monitor for: rapid voltage drop without a corresponding current measurement (suggesting internal resistance is collapsing due to an internal short), cell voltage diverging from the pack average beyond the normal balancing range (an outlier cell that is losing voltage anomalously), and voltage that is not consistent with the rest period behaviour expected given recent SOC history.

These voltage anomalies are subtle and difficult to distinguish from measurement noise or aging drift in isolation. They are most useful as a confirming signal in combination with other detection methods.

### Gas Detection

Gas sensors provide earlier warning than temperature for Stage 1 onset because gas generation begins during the anode-electrolyte reaction stage — before temperatures have risen to the levels that trigger hardware temperature faults.

**CO sensors** detect carbon monoxide from electrolyte decomposition. CO generation begins around ~100°C and is detectable at ppm levels with electrochemical sensors (consistent with anode-electrolyte reaction onset; Feng et al. 2018). A CO sensor inside the pack enclosure can provide a Stage 1 warning when temperature monitoring alone would still show normal readings.

**VOC (volatile organic compound) sensors** detect the hydrocarbon decomposition products of electrolyte solvents — ethylene, propylene, and carbonate esters. VOC sensors are less specific than CO but are sensitive to a broader range of decomposition products.

**H₂ sensors** detect hydrogen gas from the anode-electrolyte reaction. Hydrogen is detectable well before thermal runaway and provides warning at a stage when intervention is still effective.

Gas sensing is not universal in current production EV packs — it adds cost, the sensors require validation over the pack lifetime, and placement inside a sealed enclosure raises questions about sensor calibration drift. But the trend is toward inclusion, particularly in high-energy-density packs where the time window between early onset and catastrophic failure is shorter.

### Pressure Sensing

Many production Li-ion cells include a **Current Interrupt Device (CID)** or burst disc that permanently disconnects the current path when internal pressure exceeds a set threshold. Before the CID activates, internal pressure rises can be detected by a pressure sensor in the pack enclosure.

A pack-level pressure sensor monitoring the headspace above the modules provides a Stage 1 or early Stage 2 indicator. When a cell begins venting gas (before the burst disc opens), that gas accumulates in the pack enclosure and raises pressure. The rise is detectable with a simple MEMS pressure sensor well before visible smoke or significant temperature rise at the module level.

---

## BMS Response by Stage

**Stage 0 response (abuse prevention)**: standard fault response — reduce charging current, derate power, open charge contactor if temperature limits are reached. This is the routine operation of OV, OT, UTC, and OCD protection described in the [Error Handling & Fault Reporting](./error-handling-fault-reporting.md) post. Thermal management is engaged at maximum capacity. This prevents reaching Stage 1 in the vast majority of cases.

**Stage 1 response (early onset)**: stop all charging immediately. Switch thermal management to maximum cooling mode. Alert the driver and VCU with a high-priority CAN fault message. Log all sensor data continuously at maximum rate for post-event analysis. If CO or VOC sensor triggers: flag the affected module, restrict discharge current to minimum necessary for safe vehicle operation (move the vehicle to a safe location), and alert the owner via telematics if the vehicle is unoccupied.

**Stage 2 response (thermal runaway underway)**: open all contactors immediately — main positive, main negative, charge path. There is no "let the driver finish the manoeuvre" grace period at this stage. HV is removed. Broadcast maximum-severity fault over CAN and telematics. If the vehicle system includes an active suppression system (typically only in buses and trucks, not passenger cars due to weight and packaging), it is triggered now. The driver is instructed via dashboard and telematics to exit the vehicle and move away.

**Stage 3 (propagation)**: the BMS's role is complete. Physical containment, fire suppression, and emergency services are the appropriate resources. The event log stored in the BMS's NVM (which has its own independent power supply from the 12V auxiliary in many designs) provides the forensic record for investigation.

---

## Chemistry Safety Comparison

The choice of cathode chemistry affects thermal runaway characteristics substantially. This is not just about threshold temperatures — it is about whether the cathode releases oxygen (which makes the fire self-sustaining) and how much total energy is released.

| Chemistry | Runaway onset (°C) | Max temp (°C) | O₂ release | Relative safety |
|---|---|---|---|---|
| LCO | ~120 | >700 | High | Low — low onset, high O₂ release |
| NMC 811 | ~140 | ~600 | Med-high | Medium — high nickel reduces onset temp |
| NMC 532 | ~180 | ~500 | Medium | Med-high — lower nickel, higher onset |
| LFP | ~250 | ~400 | Very low | High — olivine structure, minimal O₂ |
| LTO | >300 | Very low | None | Very high — titanate anode, no copper dissolution |

*Onset temperatures are approximate and vary with SOC, cell design, and test conditions. See Feng et al. 2018 and Wang et al. 2012 in Further Reading for detailed ARC data.*

LFP's safety advantage is structural: the phosphate-oxygen bond in the olivine lattice (LiFePO₄) is significantly stronger than the metal-oxide bonds in layered cathodes (NMC, NCA, LCO). Releasing oxygen from LFP requires considerably more energy than from NMC, which is why LFP's self-sustaining runaway onset is roughly 110°C higher than NMC 811 (~250°C vs ~140°C — illustrative values from ARC characterisation; Feng et al. 2018) and why LFP fires, when they do occur, are less energetic and slower-propagating.

This is one of the primary engineering reasons that manufacturers prioritising safety — particularly for bus and truck applications where pack access in an emergency is difficult — have shifted toward LFP chemistry despite its lower energy density. The safety margin in thermal management design with LFP is substantially wider.

LTO (lithium titanate anode) is notable for near-complete absence of thermal runaway risk: no copper current collector (no copper dissolution), no metallic lithium plating, and a cathode that decomposes at very high temperatures. The tradeoff is energy density roughly half that of NMC, and significantly higher cost. LTO is used in applications where thermal stability and cycle life are paramount over energy density.

---

## Experiments

### Experiment 1: Monitor Temperature Rate-of-Change for Early Warning

**Materials**: Arduino Uno, NTC thermistor (10 kΩ at 25°C), 18650 NMC cell, INA219, moderate load resistor (5 Ω), hairdryer as controlled external heat source (for safe above-normal temperature testing without chemical abuse), Arduino serial monitor.

**Procedure**:
1. Wire the NTC thermistor as a voltage divider (thermistor + 10 kΩ fixed resistor from 3.3 V to GND). Read the ADC value at 500 ms intervals. Convert to temperature using the Steinhart-Hart equation or a lookup table.
2. Implement a dT/dt calculation: (T_now - T_5_samples_ago) / (5 × 0.5 s). Store a rolling buffer of temperature readings.
3. Set a dT/dt alarm threshold of 1°C/second (safe to test with a hairdryer at 20 cm). Log both absolute temperature and dT/dt to serial.
4. Run the cell under a 1 A load (normal operation). Observe dT/dt — should be very low (< 0.1°C/s). Then gently warm the cell from a distance with the hairdryer and observe dT/dt rise and trigger the alarm before absolute temperature hits a high limit.

**What to observe**: The dT/dt alarm triggers while absolute temperature is still within a safe range — demonstrating that rate-of-change detection provides earlier warning than threshold detection alone. Log both traces and mark when each alarm would have triggered. This quantifies the detection window advantage that dT/dt monitoring provides.

---

### Experiment 2: Simulate Multi-Layer Detection with Temperature + Voltage Cross-Check

**Materials**: Arduino Uno, INA219, NTC thermistor, 18650 cell, adjustable load (potentiometer + power resistor), DMM.

**Procedure**:
1. Log cell voltage (via INA219), cell current, surface temperature, and dV/dt (rolling derivative of voltage) simultaneously at 200 ms intervals.
2. Implement three independent fault checks: (a) absolute temperature > threshold, (b) dT/dt > threshold, (c) voltage drop rate inconsistent with current (plausibility — if dV/dt is large but current is zero or low, flag as anomalous voltage drop).
3. Under normal load: observe all three checks reading normal. None should trigger.
4. Simulate a partial internal short by briefly touching a low-resistance wire across a fraction of the cell voltage (use a small portion of the voltage divider — do not short the cell directly). Observe whether the voltage anomaly check triggers.

**What to observe**: The multi-layer approach — each detection method has blind spots that the others compensate for. Temperature alone would miss a developing internal short until significant heat has accumulated. Voltage anomaly detection can flag the short electrically before heat propagates to the thermistor. This is the principle behind production BMS multi-modal detection: the combination has higher diagnostic coverage than any individual method.

---

### Experiment 3: Chemistry Comparison — Thermal Response Under Identical Abuse

**Materials**: 1× 18650 NMC cell and 1× 26650 LFP cell (both healthy, same capacity in Ah), INA219, NTC thermistor on each cell, identical resistive load, Arduino data logger.

**Procedure**:
1. Discharge both cells to their respective 50% SOC points. Rest 30 minutes.
2. Connect the same resistive load to each cell in turn. Log temperature rise, voltage sag, and current at 200 ms intervals for a 5-minute moderate discharge.
3. Increase the load to a higher current (C/1 rate for each cell based on its capacity) and repeat.
4. Compare: NMC vs LFP temperature rise rate at the same C-rate, NMC vs LFP voltage sag (lower sag = lower R_internal), and the relationship between internal resistance and heat generation (P = I² × R).

**What to observe**: LFP typically has slightly higher internal resistance than premium NMC at room temperature, so at the same absolute current it generates more I²R heat — but its thermal runway onset is ~110°C higher, providing a much wider margin. The experiment illustrates that thermal safety is not just about operating temperature but about the margin between operating temperature and onset temperature. LFP's wide margin is the reason it can tolerate thermal management imperfections that would be dangerous in NMC.

---

## Further Reading

- **Plett, G.L.** — *Battery Management Systems, Vol. 1* (Artech House, 2015) — Ch. 2 covers degradation and failure modes including thermal runaway chemistry in the context of BMS design requirements.
- **Andrea, D.** — *Battery Management Systems for Large Lithium-Ion Battery Packs* (2010) — Ch. 8 covers thermal management system design and integration with the BMS, including temperature monitoring strategies.
- **Feng, X. et al.** (2018) — "Thermal runaway mechanism of lithium ion battery for electric vehicles: A review" — *Energy Storage Materials* 10 — comprehensive review of cascade chemistry, triggering mechanisms, and detection methods with extensive experimental data.
- **Bernhard, A. et al.** (2011) — "Accelerating Rate Calorimetry of lithium-ion cells" — *Journal of Power Sources* — practical reference for understanding ARC data and what it means for BMS threshold setting.
- **IEC 62619:2022** — Safety requirements for secondary lithium cells for industrial applications — the standard that governs ARC testing requirements and thermal abuse test protocols.
- **UL 9540A** — Standard for thermal runaway fire propagation testing for large energy storage systems — relevant for stationary storage applications, but the multi-cell propagation test methodology applies to understanding propagation risk in EV packs.
- **Battery University — BU-304: Why Lithium-ion Batteries Fail** — accessible, well-referenced treatment of failure modes and thermal runaway for enthusiast-level readers.
- **Wang, Q. et al.** (2012) — "Thermal runaway caused fire and explosion of lithium ion battery" — *Journal of Power Sources* — systematic treatment of the cascade stages with temperature and gas data.
- [The Lithium-Ion Cell →](../battery/cell.md) — cathode chemistry, anode chemistry, and electrolyte — the physical materials whose reactions drive the cascade.
- [Thermal Management →](../battery/cooling.md) — the cooling system that the BMS controls to keep temperatures in the safe operating range and prevent Stage 0 conditions from developing.
- [Error Handling & Fault Reporting →](./error-handling-fault-reporting.md) — how temperature faults, OV faults, and gas sensor triggers are classified, debounced, and acted on at the system level.
- [HV Safety Architecture →](./hv-safety-architecture.md) — ISO 26262 safety mechanisms and how the overall HV system isolation design supports fault containment.
- [Charging Algorithm →](./charging-algorithm.md) — the charging profile, temperature derating, and UTC protection that prevent thermal stress during charging.

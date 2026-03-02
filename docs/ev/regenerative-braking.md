# Regenerative Braking — From Pedal Lift to Stored Energy

*Prerequisites: [EV Nodes — ECU Architecture](./ev-nodes.md) · [State of Power (SOP)](../bms_concepts/state-of-power-sop.md) · [OCV vs Terminal Voltage](../bms_concepts/ocv-vs-terminal-voltage.md)*
*Related: [Why Range Drops in Winter](./why-range-drops-in-winter.md)*

---

## Why Did My Regen Disappear?

Two scenarios that every EV driver has noticed.

The first: you leave home on a full charge. Lifting your foot off the accelerator barely slows the car — there is almost no regen. Twenty minutes later, after the battery has dropped to 80%, the regen feel returns and stays strong for the rest of the drive.

The second: it is January. Battery at 50% SOC — nowhere near full. You lift off the accelerator and the regen still feels weak, almost like coasting. Ten minutes into the highway, the bite comes back.

Both situations are the BMS making a deliberate decision based on real physics. The battery could not safely absorb more charge current at that moment. This post explains the full chain of events: why kinetic energy can be recovered at all, how the motor and inverter work in reverse, what the BMS is calculating, and how the vehicle arbitrates between regen and friction brakes. By the end, both scenarios will have a specific, mechanical explanation.

---

## What Regenerative Braking Is

In a conventional friction brake, the kinetic energy of a moving vehicle is converted into heat at the brake pads and rotors. That heat radiates into the air. The energy is gone.

Regenerative braking runs the traction motor as an electrical generator. Instead of turning electrical energy into mechanical motion, it turns mechanical motion back into electrical energy, which is routed back into the battery. The battery partially refills. The car slows down.

The practical recovery rate in real-world driving is 10–25% of total energy consumed on a city cycle, where there is frequent braking. On a highway run with minimal braking, it drops to 5–10%. Regen is most valuable in dense stop-start traffic and on long descents.

Regen does not and cannot replace friction brakes. At low speeds (below roughly 5–10 km/h), the physics of the motor make regen ineffective — the motor cannot generate meaningful braking force. Emergency stops, ABS intervention, and wheel-lockout protection all require hydraulic calipers. Regen is a supplement, not a substitute.

---

## The Motor as a Generator — Four-Quadrant Operation

The same machine that propels the car also performs regeneration. No extra hardware is required. To understand why, you need to understand what a permanent magnet synchronous motor (PMSM) actually does.

During normal driving, the motor controller (MCU) drives alternating currents through the stator windings. These currents create a rotating magnetic field. The permanent magnets in the rotor chase this field, and the rotor spins. Electrical energy becomes mechanical energy.

When the rotor is already spinning — because the car is moving — the rotating magnets generate their own voltage in the stator windings by electromagnetic induction. This is called back-EMF (back electromotive force). It is proportional to rotor speed: faster spin, higher back-EMF. If you connect a load to the stator terminals while the rotor is spinning, current flows. The motor is now a generator.

The PMSM is reversible by design. The same inverter that drives the motor during propulsion controls the current direction during regen. In power electronics, this is called four-quadrant operation. The four quadrants are:

- **Quadrant I** — forward motoring: positive torque, positive speed. Normal driving.
- **Quadrant II** — forward braking (regen): negative torque, positive speed. Lifting off or braking while moving forward.
- **Quadrant III** — reverse motoring: negative torque, negative speed. Reversing.
- **Quadrant IV** — reverse braking (regen): positive torque, negative speed. Braking while reversing.

In an EV, Quadrant II is where regen lives. The motor is spinning forward (the car is moving forward) but the motor controller commands negative torque — a braking force — which causes current to flow back into the DC bus and into the battery.

One important consequence of the back-EMF relationship: regen effectiveness is proportional to speed. At 100 km/h, the back-EMF is high and the motor can generate significant braking torque. At 10 km/h, the back-EMF is much lower. Below about 5–10 km/h, the back-EMF is so small that the motor cannot generate meaningful current even with full inverter control. This is why every EV blends out regen near a standstill and relies on friction brakes for the last few km/h. One-pedal driving vehicles handle this with a brake hold function — once speed drops to near zero, the electric park brake or a slow hydraulic application holds the car stationary.

---

## MCU Control in Regen — Field-Oriented Control

The MCU uses a technique called field-oriented control (FOC) to manage the motor precisely, both in motoring and regen. FOC decomposes the stator current into two independent components:

- **d-axis current** — controls the magnetic flux in the machine. For a permanent magnet motor, this is often held near zero in the base speed range.
- **q-axis current** — controls torque. Positive q-axis current produces positive torque (motoring). Negative q-axis current produces negative torque (braking / regen).

During regen, the VCU sends a regen torque request to the MCU over CAN. The MCU translates that into a negative q-axis current command and executes it through the three-phase inverter switches. Current flows from the motor back into the DC bus. The DC bus voltage rises slightly during regen as energy flows from the motor into the bus capacitor and pack — the pack absorbs this current as a charge event.

The MCU respects two limits simultaneously. Its own current and voltage limits (protecting the inverter and motor windings). And the BMS's published maximum charge current — the SOP_charge signal on CAN. If the VCU requests more regen torque than the BMS limit allows at the current bus voltage, the MCU clips its torque to stay within the charge current limit. The driver feels a softer regen than requested.

---

## BMS Charge Acceptance — The Gating Signal

The BMS continuously calculates and publishes `SOP_charge` on CAN: the maximum power the pack can safely absorb right now. The [State of Power post](../bms_concepts/state-of-power-sop.md) covers the derivation in detail. The short version:

```
I_max_charge = (V_max − OCV) / R_total
```

`V_max` is the upper cell voltage limit (for NMC, typically 4.15–4.20 V per cell). `OCV` is the cell's current open-circuit voltage, which rises with SOC. `R_total` is the cell's total effective resistance — ohmic R₀ plus the RC pair contributions — which rises with cold.

Two things shrink `I_max_charge` to near zero.

**High SOC**: as the battery fills, OCV rises toward V_max. The numerator `(V_max − OCV)` shrinks. At 95% SOC on an NMC cell, OCV might be 4.10 V against a V_max of 4.15 V — leaving only 50 mV of headroom. Even 100 mA of charge current causes a voltage rise of `I × R_total` on top of OCV, pushing the cell toward its limit. The BMS must restrict charge current to near zero to avoid overvoltage. Regen torque collapses. This is the first scenario from the introduction: full charge, almost no regen.

**Cold temperature**: R_total is strongly temperature-dependent. It follows an Arrhenius-like relationship — roughly doubling for every 15–20°C drop for typical NMC cells. At 0°C, R_total might be 2–3× its 25°C value. For a given charge current, the voltage rise across R_total is 2–3× larger. To keep the cell below V_max, the BMS must allow 2–3× less current. Regen is weak not because the battery is full, but because the battery cannot absorb current quickly without spiking its cell voltages. This is the second scenario: cold January morning, 50% SOC, weak regen.

The BMS publishes this updated `SOP_charge` every few hundred milliseconds. As the pack discharges during a drive (SOC drops away from 100%) or as the pack self-heats through I²R losses (temperature rises), `SOP_charge` increases and regen strength recovers. This is why regen "comes back" mid-drive on both a post-full-charge run and a cold morning run.

---

## VCU Brake Blending — Coordinating Regen and Hydraulic Brakes

The driver presses the brake pedal. What happens in the next 10 milliseconds determines whether the braking feel is smooth or abrupt, and how much energy is recovered.

The brake pedal in a modern EV is typically decoupled from the hydraulic circuit — there is no direct mechanical link between pedal and caliper. A brake-by-wire system reads pedal travel and pressure, then the VCU decides how to distribute braking force between regen and the hydraulic actuators.

The VCU's blending strategy works like this:

1. Read total braking demand from the brake pedal sensors (in Nm of deceleration torque or m/s² of target deceleration).
2. Read maximum available regen torque from the MCU — which is limited by the BMS's current `SOP_charge`.
3. Command regen torque first, up to the available maximum. This is free energy recovery.
4. Calculate the remaining braking demand: total demand minus regen torque.
5. Command the hydraulic system to deliver the shortfall via the calipers.

The driver does not feel this arbitration. The total deceleration matches the pedal input. Whether that deceleration comes from regen or friction is invisible to the driver — unless regen collapses suddenly (during an ABS event or at a BMS fault), in which case the hydraulic system must respond immediately or the deceleration feel changes abruptly.

### ABS and ESC Integration

Anti-lock braking (ABS) and electronic stability control (ESC) add a hard constraint: if the ABS ECU detects that a wheel is approaching lockout, it cuts braking torque to that wheel to restore grip. Regen torque counts as braking torque. The ABS system cannot distinguish between regen and friction braking in terms of wheel slip — it only sees the result at the wheel.

When ABS activates, the VCU must cut regen immediately. The ABS ECU publishes a "cut regen" flag on CAN. The VCU and MCU must respond within the CAN cycle time — typically within 10 ms — to zero out the regen torque request. From that point, the ABS system has full authority over the hydraulic calipers, and regen stays off until the ABS event clears.

ESC works similarly. If ESC needs asymmetric braking between the left and right wheels — for example, to prevent a spin — regen applied uniformly to the drive axle interferes with the per-wheel torque vectoring the ESC is trying to achieve. The VCU reduces or eliminates regen whenever ESC is active.

This is one reason regen torque is not a simple "more is better" design parameter. More aggressive regen increases energy recovery but also increases the frequency and severity of interactions with ABS and ESC, which complicates the control architecture and can degrade the feel of stability interventions.

---

## One-Pedal Driving

One-pedal driving is not a different physical system — it is a calibration choice. The mapping between "zero accelerator pedal" and motor torque output is a software parameter. In standard mode, zero pedal might map to a small coast-down deceleration of around 0.02–0.04 g — similar to engine braking in a neutral-gear ICE. In one-pedal mode, the same zero-pedal position maps to 0.1–0.2 g of deceleration, achieved through aggressive regen torque.

The benefit is maximised energy recovery in stop-start driving: the driver rarely touches the brake pedal, so nearly all deceleration energy goes through the regen path rather than the friction path. The disadvantage is that the regen-based deceleration is still subject to all the same limits — at high SOC or cold temperatures, the deceleration feel changes even without touching the brake pedal, which some drivers find unpredictable.

At very low speeds (below 5–10 km/h), one-pedal mode blends out regen and applies a hold function — either the electric park brake or a slow hydraulic application — to bring the car to a complete stop without rolling. The driver experiences a slight firmness in the deceleration just before zero speed. This is the hydraulic system taking over from the motor.

---

## Edge Cases

**Full pack on a long downhill**: the BMS has near-zero charge acceptance. Regen is almost entirely blocked. The car must use friction brakes to manage speed on the descent. In extended descents — a long Alpine pass, for example — this can generate significant heat in the brake rotors and pads. Experienced EV drivers on mountain routes use friction brakes in a low-drag mode to manage speed, rather than relying on regen that may not be available. Some vehicles warn the driver when regen is severely limited at high SOC; others simply reduce deceleration feel without explanation.

**Regen during a BMS fault**: any active cell overvoltage, overtemperature, contactor fault, or isolation fault causes the BMS to command the main contactors open. The HV bus is disconnected from the pack. The MCU loses its energy sink for regen current. Regen stops instantly. The VCU detects the loss of regen (the SOP_charge signal on CAN drops to zero or the BMS broadcasts a fault) and applies friction brakes as a fallback. The driver feels a change in brake feel but braking continues hydraulically.

**Cold-start regen recovery**: on a cold morning without preconditioning, the first 10–15 minutes of driving involve low regen due to high R_total. As the pack discharges, the I²R losses inside the cells generate heat (P = I²R), and cell temperatures rise. Once cells warm from 0°C to 10–15°C, R_total drops significantly and SOP_charge recovers. Regen strength increases mid-drive. Drivers who understand this know not to judge regen performance from the first minutes of a cold drive.

**Regen and active battery heating**: some BMS implementations deliberately accept a small charge current during regen even when SOC is high, on the logic that the I²R heat generated inside the cells helps warm the pack faster in cold weather. This is a design trade-off: accepting a small overvoltage margin violation risk in exchange for faster thermal recovery. It is a parameter-tuned behaviour, not a universal practice.

---

## How Much Energy Does Regen Actually Recover?

The round-trip efficiency of regen — kinetic energy to stored energy and back to kinetic energy — is the product of several conversion stages:

| Stage | Typical efficiency |
|---|---|
| Motor acting as generator | 90–93% |
| Inverter (switching losses, conduction losses) | 95–97% |
| Battery charge efficiency | 96–98% |
| **Kinetic → stored round-trip** | **~83–88%** |

Note that this is kinetic to stored. If that stored energy is later used for propulsion, you run through the motor and inverter efficiency again in reverse, so the full kinetic-to-kinetic round-trip is roughly 70–80%.

In practice, real-world regen contribution to total energy recovery is lower than the per-event efficiency would suggest, because not all braking events allow full regen — high-SOC blocking, ABS interventions, and low-speed blend-outs all remove opportunities. Measured contributions on standardised drive cycles:

- City cycles (WLTP Urban, US City): 10–25% reduction in net energy consumption from regen
- Combined cycles (WLTP Combined, EPA Combined): 8–15%
- Highway cycles (WLTP Extra High, US Highway): 3–8%

This is why city range figures for EVs are often better than highway figures relative to the rated range — regen is doing significant work in stop-start traffic and very little at steady highway speed.

---

## Experiment 1 — Motor as Generator: Back-EMF Demonstration

**Materials**: any small DC hobby motor (widely available, under $5), a resistive load (10–100 Ω, 1W resistor), a multimeter, and a hand drill or any mechanism to spin the motor shaft at varying speeds.

**Procedure**:

1. Connect the motor's two leads to the resistive load and the multimeter in voltage-measurement mode (in parallel with the load).
2. Spin the motor shaft by hand at a slow speed. Record the voltage on the multimeter.
3. Spin faster. Record voltage again.
4. Now switch the multimeter to current mode (in series with the load). Spin at a consistent speed. Measure current.
5. Calculate power: P = V × I at that spin speed.
6. Try different load resistor values. Observe how the current changes while voltage is roughly constant for a given speed.

**What to observe**: the motor generates a voltage proportional to spin speed — this is back-EMF in action. At very low speed, the voltage is negligible; meaningful electrical power requires meaningful rotational speed. This is exactly why regen effectiveness drops to near zero below 5–10 km/h in a real EV: at walking speed, the back-EMF of the traction motor is too low to drive significant current back into the battery. The experiment also demonstrates why regen power peaks at mid-to-high speeds and then may be limited by current limits at very high speed.

---

## Experiment 2 — Charge Acceptance vs SOC: Why a Full Battery Blocks Regen

**Materials**: one 18650 NMC cell, Arduino Uno + INA219 current/voltage sensor, bench power supply (current-limited), multimeter.

**Procedure**:

1. Discharge the cell to approximately 20% SOC (around 3.55 V resting for NMC). Rest 30 minutes.
2. Apply a 500 mA charge pulse for 10 seconds using the bench power supply. Use the INA219 to log the voltage at the start and end of the pulse. Calculate the effective resistance: R_eff = ΔV / I.
3. Record the maximum charge current that keeps cell voltage below 4.20 V. Call this I_max at 20% SOC.
4. Repeat at 50% SOC (approximately 3.70 V resting), 80% SOC (approximately 3.90 V resting), and 95% SOC (approximately 4.10 V resting). Rest 30 minutes between each step.
5. At each SOC point, find the maximum current that keeps the cell below 4.20 V.
6. Plot I_max vs SOC.

**What to observe**: charge acceptance — the maximum current the cell can absorb without hitting its voltage ceiling — decreases as SOC increases, and drops steeply above 80–85% SOC. At 95% SOC, even a few hundred milliamps may push the cell to its 4.20 V limit within seconds. This is the cell-level physics behind `SOP_charge` collapsing at high pack SOC. The BMS is doing exactly this calculation — estimating headroom from OCV to V_max, divided by internal resistance — and publishing the result as the regen current limit.

---

## Experiment 3 — Log Bidirectional Current: Simulating a Drive with Regen Events

**Materials**: Arduino Uno + INA219 current/voltage sensor, one 18650 cell (or small multi-cell pack), a resistive load (5–10 Ω, 5W) for discharge, bench power supply (current-limited) for charge pulses, jumper wires for switching between load and supply.

**Procedure**:

1. Set the INA219 to log current (positive = discharge, negative = charge) and voltage at 1-sample-per-second to the Arduino serial port.
2. Discharge through the resistive load at approximately 500 mA for 60 seconds. This is your "driving" phase.
3. Switch to the bench power supply delivering 300 mA into the cell for 15 seconds. This is your "regen braking" event. Log the current reversal.
4. Switch back to the load for another 60 seconds of discharge.
5. Repeat the regen pulse two or three more times.
6. Plot current vs time (clearly showing positive discharge and negative charge pulses) and overlay voltage vs time.

**What to observe**: current direction reverses cleanly during each regen event. Voltage dips during discharge and rises during each charge pulse. Each regen pulse partially arrests the SOC decline — calculate how many mAh the regen events returned versus the total mAh discharged, and express it as a percentage. This gives a concrete, measured sense of regen's contribution. Extend the experiment by varying the SOC at which you apply the regen pulse: repeat when the cell is near its upper voltage limit and observe how the voltage rises sharply, demonstrating why the BMS reduces the allowable charge current at high SOC.

---

## Further Reading

**Textbooks**

- Ehsani, M., Gao, Y., Gay, S.E., Emadi, A. — *Modern Electric, Hybrid Electric, and Fuel Cell Vehicles* (CRC Press, 2004) — the regen braking chapter covers four-quadrant motor operation, brake blending strategy, and quantified energy recovery across drive cycles; the clearest engineering treatment of the subject
- Larminie, J. & Lowry, J. — *Electric Vehicle Technology Explained* (Wiley, 2nd ed. 2012) — accessible treatment of regen, motor drive, and brake blending without heavy mathematics
- Plett, G.L. — *Battery Management Systems Vol. 1* (Artech House, 2015) — charge acceptance modelling and SOP_charge derivation

**Key Papers**

- Gao, Y. & Ehsani, M. (2001) — "Electronic Braking System of EV and HEV — Integration of Regenerative Braking, Automatic Braking Force Control and ABS" — *SAE Technical Paper 2001-01-2478* — foundational treatment of ABS and regen integration; explains the control authority conflict and the cutover logic
- Sovran, G. & Blaser, D. (2006) — "A Contribution to Understanding Automotive Fuel Economy and Its Limits" — *SAE Technical Paper 2006-01-0392* — quantifies what fraction of energy is recoverable via regen for different drive cycles; the source for the 10–25% city / 3–8% highway range
- de Santiago, J. et al. (2012) — "Electrical Motor Drivelines in Commercial All-Electric Vehicles: A Review" — *IEEE Transactions on Vehicular Technology* — covers motor types and their regen characteristics in real EV applications

**Online Resources**

- Battery University — "BU-409: Charging Lithium-ion" — covers charge acceptance and why regen current must be limited at high SOC
- TI Application Report SLUA887 — bidirectional battery charging with a BMS — illustrates the hardware path regen current takes through the AFE and back into the cells

**Standards**

- SAE J1711 — *Recommended Practice for Measuring the Exhaust Emissions and Fuel Economy of Hybrid-Electric Vehicles* — standardised methodology for measuring regen energy recovery contribution on official drive cycles
- SAE J2908 — *Electric Powertrain Peak Power Rating for HEV/BEV/FCEV* — defines how peak regen power is rated and measured
- ISO 26262 — brake-by-wire with integrated regen is a safety-critical function; the brake blending arbitration between regen and hydraulic requires ASIL classification and the associated verification process

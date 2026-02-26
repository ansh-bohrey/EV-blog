# Thermal Runaway Detection and Handling in EV Packs

Thermal runaway is a self-accelerating exothermic failure mode. Prevention and early detection are critical.

![Runaway temperature curve](../../assets/codex_assetsplan/thermal-runaway/runaway-temperature-curve.svg)

## Reaction Cascade

Runaway develops through escalating chemical and thermal stages.

![Reaction cascade timeline](../../assets/codex_assetsplan/thermal-runaway/reaction-cascade-timeline.svg)

ARC-style characterization is used to understand onset behavior and severity trends.

![ARC curve placeholder](../../assets/codex_assetsplan/thermal-runaway/arc-curve-placeholder.svg)

## Detection Architecture

Early warning uses layered sensing:
- Distributed temperature sensing
- Voltage anomaly detection
- Gas/pressure indications where available

![Sensor placement concept](../../assets/codex_assetsplan/thermal-runaway/sensor-placement.svg)

## Response and Containment

BMS actions escalate with severity: derate, isolate, latch faults, and coordinate vehicle safety states. Physical pack design must limit propagation.

![Propagation barrier concept](../../assets/codex_assetsplan/thermal-runaway/propagation-barriers.svg)

## Takeaways

- Runaway mitigation is system-level: cell chemistry, pack design, sensing, and firmware.
- Detection latency strongly affects containment outcomes.
- Prevention logic upstream is the highest-value safety layer.

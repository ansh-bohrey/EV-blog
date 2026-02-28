# Battery Paralleling: Safely Connecting Battery Packs in Parallel

Paralleling packs post-distribution can increase capacity/current capability, but unmanaged connection can create severe inrush and imbalance currents.

![Parallel pack schematic](../../assets/codex_assetsplan/battery-paralleling/parallel-pack-schematic.svg)

## Main Risk: Inrush and Voltage Mismatch

When bus voltages differ, high transient current can flow immediately at connection.

![Inrush current waveform](../../assets/codex_assetsplan/battery-paralleling/inrush-current-waveform.svg)
![Voltage match tolerance band](../../assets/codex_assetsplan/battery-paralleling/voltage-match-band.svg)

## Controlled Connection Strategy

Use pre-charge and sequence control before closing main parallel contact paths.

![Pre-charge sequence timeline](../../assets/codex_assetsplan/battery-paralleling/precharge-sequence-timeline.svg)

## Current Sharing Reality

Parallel sharing depends on branch resistance and dynamic impedance.

![Current sharing vs resistance mismatch](../../assets/codex_assetsplan/battery-paralleling/current-sharing-vs-resistance.svg)

## Takeaways

- Voltage matching and pre-charge are non-negotiable.
- Equal nominal ratings do not guarantee equal current sharing.
- Control logic must assume asymmetric real-world behavior.

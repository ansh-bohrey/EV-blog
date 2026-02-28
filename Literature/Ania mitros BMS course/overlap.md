# Ania Mitros BMS Course vs `topics.md` — Overlap

Source index: `Literature/Ania mitros BMS course/index.md`

## Course topics mapped to `topics.md`
| Course topic (from PDFs) | Closest `topics.md` match | Overlap | Notes |
| --- | --- | --- | --- |
| Introduction to BMS scope and course roadmap | BMS Introduction | Direct | Core intro alignment |
| Rechargeable battery cell chemistries | Cell | Direct | Cell chemistries and basics |
| Energy density and OCV vs SOC curves | OCV vs terminal voltage; SOC; Cell | Partial | OCV/SOC is explicit, energy density is only implied in Cell topic |
| Safety in lithium-ion battery design | Thermal runaway detection/handling; HV Safety Architecture | Partial | Safety concepts overlap, but course is broader than those two topics |
| Cell behavior basics: lifetime and charging | Cell; Charging algorithm | Partial | Lifetime is not explicit in `topics.md` |
| System architecture (electrical) | EV Nodes; BMS Introduction | Partial | System architecture not explicitly listed as a standalone topic |
| Battery cost overview (finance) | — | Missing | Not present in `topics.md` |
| State estimation overview | SOC; SOH; SOP | Direct | Matches estimation topics |
| Core BMS actions: battery switch open/close, system communication, cell balancing | HV Safety Architecture; Communication interface; Cell balancing | Partial | Communication is a topic, switch safety in HV architecture |
| State estimation: SOC, SOH, available power | SOC; SOH; SOP | Direct | Available power aligns with SOP |
| Fault detection: over/under-voltage, over-current, over-temp, BMS fault, isolation detection | Error handling / fault reporting; Thermal runaway detection; HV Safety Architecture; Deep discharge protection | Partial | Isolation monitoring and safety overlap; deep discharge is partial |
| Measurements: cell voltages, battery current, temperatures, diagnostics | Analog Front End (AFE); BMS Validation | Partial | Measurement hardware and validation overlap |
| Essential vs discretionary BMS functions | BMS Introduction | Partial | Framing detail rather than a topic |
| Terminology for cell state and capacity | Cell; SOC | Partial | SOC alignment, general cell basics |
| OCV and SOC relationship | OCV vs terminal voltage; SOC | Direct | Strong overlap |
| Cell impedance and I×R drop | ECM Primer; OCV vs terminal voltage | Direct | ECM topic explicitly includes R0 and RC |
| Time-dependent responses and hysteresis | ECM Primer; SOC | Partial | ECM and estimation link, not explicit in `topics.md` |
| Aging effects | SOH | Direct | Aging/SOH alignment |
| Cell construction overview | Cell | Direct | Direct overlap |
| Systems engineering trade-offs and $ quantification | — | Missing | Not present in `topics.md` |
| Cell voltage measurement accuracy | AFE; BMS Validation | Partial | Accuracy not explicit, but measurement/validation overlap |
| Methods for valuing accuracy | BMS Validation | Partial | Validation topic is broader |
| BMS chip datasheet accuracy | AFE | Direct | Measurement hardware |
| Battery current measurement accuracy | AFE; BMS Validation | Partial | Measurement and validation overlap |
| SOC estimation by current integration | SOC | Direct | Core SOC method |
| SOC estimation from OCV lookup and cell models | SOC; OCV vs terminal voltage; ECM Primer | Direct | Multiple direct links |
| Combining methods (e.g., Kalman) | SOC; ECM Primer | Partial | Filtering not explicit in `topics.md` |
| Limitations with current flow and error accumulation | SOC | Partial | Method limitations not explicit |
| Cell balancing: intro, current sizing, passive vs active | Cell balancing | Direct | Strong overlap |
| Thermal considerations for balancing | Cooling / Thermal management | Partial | Balancing thermal management is a subset |
| When to balance (relative to measurement/SOC) | Cell balancing; SOC | Partial | Practical timing not explicit |
| Drivers of imbalance (self-discharge, unequal load, faults) | Cell balancing; Cell | Partial | Causes are not explicit in `topics.md` |
| Why measure temperature (controls/safety) | Thermal runaway detection/handling; Cooling / Thermal management | Partial | Measurement emphasis not explicit |
| Sensor placement | Cooling / Thermal management; AFE | Partial | Sensors not explicit |
| Thermistor vs thermocouple | AFE | Partial | Sensor selection not explicit |
| Thermistor circuits and equations | AFE | Partial | Circuit detail not explicit |
| Measurement limitations and error sources | BMS Validation | Partial | Validation covers errors broadly |
| Isolation in HV systems and safety rationale | HV Safety Architecture | Direct | Isolation monitoring named there |
| Isolation requirements and trade-offs | HV Safety Architecture | Direct | Matches safety architecture scope |
| Isolation detection ideas and diagnostics | HV Safety Architecture; BMS Validation | Partial | Detection circuits not explicit |
| Impact of capacitance on isolation detection timing | HV Safety Architecture | Partial | Timing detail not explicit |
| Battery safety (automotive/stationary) | Thermal runaway detection/handling; HV Safety Architecture | Partial | Broad safety framing not explicit |
| Standards, terms, key considerations | Standards (AIS/ISO); BMS Introduction | Partial | Standards list exists, not safety-specific |
| Fault tolerance concepts and fault types | Error handling / fault reporting; BMS Validation | Partial | Fault tolerance not explicit |
| Analysis tools: FTA, DFMEA | BMS Validation | Direct | DFMEA mentioned explicitly |
| Safety diagnostics and hardware protections | HV Safety Architecture | Partial | Hardware protections implied |
| Reliability and accelerated lifetime testing | — | Missing | Not present in `topics.md` |
| Arrhenius equation and acceleration factor | — | Missing | Not present in `topics.md` |
| AEC-Q100 reference context | Standards (AIS/ISO) | Partial | AEC-Q100 not listed |
| Mission profile and caveats | — | Missing | Not present in `topics.md` |
| Design/test process and reliability test flow | BMS Validation | Partial | Validation overlap but narrower |
| Over-design vs under-design trade-offs | — | Missing | Not present in `topics.md` |

## `topics.md` items not clearly covered in the course PDFs
| `topics.md` item | Notes |
| --- | --- |
| Communication interface; CAN; RS-485/RS-232 | Interfaces not covered in course index |
| Ignition handling | Not seen in course index |
| Deep discharge protection | Only indirectly implied in fault detection |
| Charging algorithm | Only lightly referenced as “charging” in intro |
| Post-PDU paralleling | Not covered |
| BMS during a drive | Not covered |
| EV Nodes; Why range drops in winter | Not covered |
| AIS 156; AIS 004; ISO 26262; ISO 13849 | Standards list not covered explicitly in course index |

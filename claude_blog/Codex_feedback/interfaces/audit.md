# Audit Feedback — Claude Blog / Interfaces

## Summary
The interfaces section is strong on conceptual flow and practical engineering intuition. Accuracy is generally good but there are a few concrete technical errors and many numeric claims that need sourcing. Adding citations for protocol/standard‑level facts will materially improve credibility.

## File-Specific Feedback

### claude_blog/interfaces/communication-interface.md
- Clear layered model; good mapping from AFE buses to vehicle/charger protocols.
- One key factual error in the AFE bus section (BQ769x0 interface type).
- Several protocol‑level numeric mappings (J1772 PWM, UDS IDs) need citations or “example” labels.

### claude_blog/interfaces/can.md
- Excellent conceptual treatment; very readable and accurate in most places.
- Historical claims and physical‑layer constraints should be sourced.
- Some numeric limits (bus length, utilization) are best‑practice heuristics and should be marked as such.

### claude_blog/interfaces/rs-485-232.md
- Strong explanation of UART framing, RS‑485 electrical behavior, and biasing.
- Most numeric thresholds are accurate but should be tied to standards or app notes.
- A few RS‑232 limits and speed/distance statements need citations or should be softened.

## Persona Evaluations

### A) A‑ Engineering Student
- Flow: High; builds from basics to practical tooling.
- Ease of understanding: High; clear framing and examples.
- Depth: Good; could add a “minimum spec” table with cited sources.
- Accuracy: One concrete error (BQ769x0 bus type) and several unsourced numeric claims.
- What I learned: How protocol selection is driven by physical constraints and system architecture.

### B) EV Enthusiast
- Flow: Engaging and intuitive.
- Ease of understanding: High.
- Depth: Good; plenty of practical context.
- Accuracy: Some details (J1772 mapping, RS‑232 voltage ranges) need evidence to be trusted.
- What I learned: The reason different layers exist and how CAN vs RS‑485 map to real use cases.

### C) Senior EV Industry Engineer
- Flow: Solid; reads like a compact architecture guide.
- Ease of understanding: Good.
- Depth: Appropriate for a blog, but needs citations for standards‑level claims.
- Accuracy: One AFE protocol error, plus several “rule‑of‑thumb” numbers that need to be labeled or sourced.
- What I learned: The explanation of isoSPI and biasing is concise and useful, but citations would elevate it.

## Evidence‑Backed Corrections

### 1) AFE communication bus type for TI BQ769x0 (communication-interface.md)
**Claim in blog:** “The TI BQ76940 and BQ76920 both use SPI.”

**Evidence:** TI’s product pages/datasheets for BQ76920 and BQ76940 list an I2C interface (not SPI). The devices are configured and read via I2C.

**Correction (proposed text):**
“The TI BQ76920 and BQ76940 use **I2C**. Some other AFE families use SPI or isoSPI, but BQ769x0 is I2C‑based.”

**Sources:**
- TI BQ76920 product page (I2C interface): https://www.ti.com/product/BQ76920
- TI BQ76940 product page (I2C interface): https://www.ti.com/product/BQ76940

---

### 2) isoSPI daisy‑chain description (communication-interface.md)
**Claim in blog:** isoSPI daisy‑chaining through LTC6804/LTC6811.

**Evidence:** Analog Devices’ LTC6804 documentation describes isoSPI and daisy‑chain topology for multi‑cell monitoring.

**Correction (proposed text):**
(No change required; add a citation.)

**Source:** Analog Devices LTC6804 isoSPI documentation: https://www.analog.com/en/products/ltc6804-1.html

---

### 3) RS‑485 differential thresholds and biasing (rs-485-232.md)
**Claim in blog:** ±200 mV differential threshold, biasing to avoid undefined state.

**Evidence:** Analog Devices AN‑960 provides the ±200 mV RS‑485 receiver threshold and discusses fail‑safe biasing.

**Correction (proposed text):**
(No change required; add a citation.)

**Source:** Analog Devices AN‑960: https://www.analog.com/media/en/technical-documentation/application-notes/AN-960.pdf

---

### 4) RS‑485 node counts (rs-485-232.md)
**Claim in blog:** 32 unit loads; higher with fractional‑load receivers.

**Evidence:** Eaton’s RS‑485 reference notes the 32‑node unit‑load baseline and higher counts for fractional‑load transceivers.

**Correction (proposed text):**
(No change required; add a citation.)

**Source:** Eaton RS‑485 communication guide: https://www.eaton.com/content/dam/eaton/products/industrial-controls-drives-automation-sensors/industrial-control-division/communication/rs485-communication-guide/ib230004en.pdf

---

## Claims That Need Evidence or Qualification

### communication-interface.md
- J1772 PWM duty cycle mapping to current (10–85% → 6–51 A). Needs a J1772 standard citation or should be labeled as an example.
- “CCS uses PLC ISO 15118.” True but should cite ISO 15118 or a standards summary.
- UDS example IDs (0x7E2/0x7EA). Should be labeled as common examples; IDs are OEM‑specific.

### can.md
- Bus length vs bit rate table (40 m at 1 Mbps; 500 m at 125 kbps). These are common rules of thumb but need a source or a “typical practice” label.
- “CAN FD and classic cannot coexist on the same physical segment.” Should be refined to “classic‑only nodes cannot coexist with FD frames; all nodes on a segment must be FD‑capable if FD frames are present,” with a citation.
- Historical claims (1983 development, 1986 presentation, 1991 first production). Add a source (Bosch history page).

### rs-485-232.md
- RS‑232 voltage levels (±3 to ±15 V) and max speed/distance. Should be sourced to TIA/EIA‑232‑F or a vendor app note.
- RS‑485 speed/distance table is a rule‑of‑thumb; mark as illustrative or cite a vendor guide.
- “RS‑232 specified max 20 kbps at 15 m.” Needs a standard citation or should be marked as typical.

## Sources (for evidence)
- TI BQ76920 product page (I2C interface): https://www.ti.com/product/BQ76920
- TI BQ76940 product page (I2C interface): https://www.ti.com/product/BQ76940
- Analog Devices LTC6804 isoSPI docs: https://www.analog.com/en/products/ltc6804-1.html
- Analog Devices AN‑960 (RS‑485 thresholds, biasing): https://www.analog.com/media/en/technical-documentation/application-notes/AN-960.pdf
- Eaton RS‑485 communication guide (unit loads): https://www.eaton.com/content/dam/eaton/products/industrial-controls-drives-automation-sensors/industrial-control-division/communication/rs485-communication-guide/ib230004en.pdf
- ISO 11898‑2:2016 physical layer summary/extract: https://www.emcfastpass.com/iso-11898-2-2016-pdf
- Bosch CAN history page (timeline): https://www.bosch-semiconductors.com/system-resources/overview/can/


---

## Status Check (2026-02-26)
- **Implemented:** The AFE interface correction is reflected in `claude_blog/interfaces/communication-interface.md` (BQ769x0 explicitly called out as I2C).
- **Still open:** J1772 PWM mapping citation, ISO 15118 citation, UDS ID example labeling, CAN FD coexistence wording, historical CAN timeline citations, RS‑232 voltage/speed limits citations, and RS‑485 speed/distance rule‑of‑thumb labeling.

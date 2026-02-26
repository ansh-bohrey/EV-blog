# Repository Guidelines

## Project Structure & Module Organization
This repository is a content planning workspace for an EV BMS blog. Everything is Markdown.
- `topics.md` is the master index of planned and completed topics.
- `topics/` contains one file per topic, grouped by area:
  - `topics/battery/` (cell, pack/module, cooling)
  - `topics/bms_concepts/` (SOC/SOH/SOP, AFE, protection, etc.)
  - `topics/interfaces/` (communication overview, CAN, RS-485/232)
  - `topics/ev/` (ECU/node architecture)
  - `topics/standards/` (AIS/ISO standards)
- `CLAUDE.md` documents the preferred blog-plan template and cross-topic dependencies.

## Build, Test, and Development Commands
There is no build system, runtime, or tests. Typical tasks are file edits and Markdown organization.
- View the index: `cat topics.md`
- List all topics: `find topics -type f -name "*.md" -maxdepth 3`

## Coding Style & Naming Conventions
This repo uses Markdown only.
- Topic files are lowercase, hyphenated slugs: `state-of-charge-soc.md`.
- Standards files use uppercase IDs with `_standard`: `ISO-26262_standard.md`.
- Follow the topic template described in `CLAUDE.md` (Goal → Audience Angles → Subtopic Flow → Experiments → Literature Review).

## Testing Guidelines
No automated tests exist. Validate changes by:
- Ensuring `topics.md` matches the files and folder structure.
- Keeping headings and section order consistent with the template.

## Commit & Pull Request Guidelines
Git history currently uses short, lowercase, descriptive messages (example: `initial ev blog topics and outline`). Follow that style.
Pull requests (if used) should include:
- A short summary of topic changes.
- Updated paths in `topics.md` if files moved or added.
- Notes on any new cross-topic links or dependencies.

## Agent-Specific Notes
When adding or reorganizing topics, update `topics.md` and maintain the dependency order noted in `CLAUDE.md`.

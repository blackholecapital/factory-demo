# Runtime-C UI Modular Split

This is a clean replacement filesystem for the Operator UI.

## Why this split exists

The original page mixed layout, state, submit logic, queue, artifacts, overwatch, and runtime panels into one fragile HTML/CSS/JS patch target. This split makes each tile independently editable.

## Entry

`index.html`

## Manifest

`manifest.json`

Controls:
- section mount paths
- API endpoints
- pod/coder mapping

## Sections

- `sections/build/` — build/improve form
- `sections/run-queue/` — queue tile
- `sections/overwatch/` — EILA overwatch tile
- `sections/runtime-pipeline/` — pipeline and lanes
- `sections/system-stats/` — CPU/RAM/pod stats
- `sections/eila-os/` — operator feed
- `sections/real-jobs/` — recent/real jobs
- `sections/topbar/` — top navigation

## Deploy sandbox

Copy the folder to:

`/opt/eila-os/job_site/apps/web-public/assets/runtime-c-live-modular`

Open:

`https://operator.xyz-labs.xyz/assets/runtime-c-live-modular/index.html`

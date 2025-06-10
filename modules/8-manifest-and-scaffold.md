# Module: Manifest & Build Scaffold

## Purpose
Defines extension packaging, permissions, and Chrome/Edge compatibility requirements.

## Responsibilities
- Configure `manifest.json` using Manifest V3
- Register content scripts and resources
- Define permissions (e.g., `activeTab`, storage)
- Manage build pipeline if needed

## Notes
- No logic or UI should be placed directly in background/service workers

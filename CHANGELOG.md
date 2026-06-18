# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and Conventional Commits.

## [1.0.0] — 2026-06-18

### Added

- Initial desktop application, built from the Claude Design "캐치 데스크탑" mock
  into a working Electron + React + TypeScript app for Windows, macOS, and Linux.
- **feat(ui):** faithful port of the three-pane design (sidebar projects + muscle
  level · capture/classify · score/trend/summary) with a frameless window and
  working traffic-light controls, plus the Settings modal and KO/EN i18n.
- **feat(capture):** Enter-to-stage then number-key classification, `@owner`
  detection, four note modes, and a clickable mode cycler on new notes.
- **feat(scoring):** local, language-agnostic 0–100 scoring across Brevity,
  Actionability, One-idea, Completeness, and Clarity, with per-mode score trend.
- **feat(ai):** real provider backend (Anthropic, OpenAI, Google Gemini, Azure
  OpenAI, Ollama, OpenAI-compatible) for AI organize and AI review, using native
  fetch with no vendor SDKs.
- **feat(persistence):** JSON state file in the user-data dir; API keys encrypted
  at rest via Electron `safeStorage`.
- **feat(export):** Markdown file save, clipboard copy, Obsidian URI, and Notion
  API export.
- **chore(build):** electron-vite build, electron-builder config for dmg/zip,
  NSIS, AppImage/deb; Node 22 pinned via `.nvmrc` and `engines`.
- **test:** unit tests for scoring, prompt building / JSON extraction, and the
  markdown exporter (18 tests).

# Touch Fish Handover

## Project Goal

Touch Fish is a terminal learning tool disguised as development output.

It is not just "hidden studying".

It should make learning look like normal work in a developer terminal.

Core idea:

> Touch Fish doesn't hide your study. It disguises it as work.

## Current Version

```txt
v0.2-dev
```

Current milestone:

```txt
Product Experience
```

## Current Run Commands

Development:

```powershell
npm run dev -- word
```

Linked CLI:

```powershell
touchfish word
```

To enable the linked CLI:

```powershell
cd "D:\Touch Fish"
npm link
```

`npm link` only needs to be run again if the project is moved, Node/npm is reinstalled, or the global link is removed.

## Current Architecture

```txt
src/
  commands/
  session/
  services/
  storage/
  models/
  config/
  ui/

assets/
  vocabulary/
  progress/

docs/
```

Do not redesign this structure during v0.2.

## Completed

- CLI foundation
- `npm run dev -- word`
- `touchfish word`
- Word Session
- Keyboard controls
- Workspace groups
- Default 3 words per workspace
- Display modes
- JSON vocabulary loading
- Local progress saving
- Build-log disguise theme
- Disguised debug/help view
- Project-root asset path resolution
- Local large vocabulary ignored by Git

## Keyboard

| Key | Action |
| --- | --- |
| `A` | Previous workspace |
| `D` | Next workspace |
| `Space` | Repeat last navigation |
| `Tab` | Switch display mode |
| `?` | Toggle debug/help view |
| `Q` | Quit |

## Vocabulary

Current local book:

```txt
assets/vocabulary/ielts.json
```

Committed example:

```txt
assets/vocabulary/ielts.example.json
```

Only `english` and `chinese` are required for current behavior.

The following fields are placeholders for later:

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

## UI Direction

Touch Fish should stay terminal-first.

Do not draw fake IDE windows.

Do not imitate VS Code as a full interface.

The terminal provides the window. Touch Fish provides believable terminal output.

Current default theme:

```txt
build-log
```

Future terminal-style themes can include:

- Git
- Cargo
- Docker
- Backend service logs
- Claude Code style terminal output
- Python REPL
- SQL console

## Current v0.2 Priorities

1. Keep the project stable.
2. Make the Word Workspace look more like real development output.
3. Keep main-screen learning signals low.
4. Keep Help disguised as diagnostics.
5. Avoid implementing Settings until v0.3.

## Not Now

- Electron
- Login
- Cloud sync
- AI features
- Database
- Settings UI
- Multi-book switching UI
- Read Mode

## Development Rules

- Small changes.
- One clear goal per step.
- Do not implement future-stage features early.
- Do not rewrite architecture.
- Run `npm run dev -- word` after changes.
- Commit after stable milestones.

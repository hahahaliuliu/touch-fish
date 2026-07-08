# Touch Fish - Project State

> Last updated: 2026-07-08

## Product Position

Touch Fish is a Terminal Learning Tool.

It is not simply a way to hide studying. The product goal is to make learning content look like normal development output, so users can study in small moments without leaving their terminal workflow.

Core line:

> Touch Fish doesn't hide your study. It disguises it as work.

## Current Stage

Current milestone:

```txt
v0.2 Product Experience
```

Priority:

1. Keep the project stable.
2. Improve the Word Workspace disguise.
3. Keep learning information out of the main screen when possible.
4. Keep Renderer and Theme responsibilities separated.
5. Save Settings, real multi-book support, and Read Mode for later versions.

## Current Architecture

```txt
src/
  commands/   CLI command entry
  session/    Session lifecycle
  ui/         Terminal rendering and themes
  services/   Business logic
  storage/    Local persistence
  models/     Data models
  config/     Default configuration and project paths

assets/
  vocabulary/ Vocabulary books
  progress/   Local progress files

docs/         Notes, format docs, and future plans
```

Architecture should stay small and direct. Do not redesign the project during v0.2.

## Current Run Commands

Development:

```powershell
npm run dev -- word
```

Linked local CLI:

```powershell
touchfish word
```

`npm link` should be run once from the project directory:

```powershell
cd "D:\Touch Fish"
npm link
```

After linking, `touchfish word` works from other directories because asset paths are resolved from the project root.

## Completed Features

### CLI

- [x] `npm run dev -- word`
- [x] `touchfish word`
- [x] No-argument help output

### Word Session

- [x] Start session
- [x] Quit session
- [x] Raw keyboard input when terminal supports it
- [x] Safe piped input for simple verification

### Keyboard

- [x] `A` previous workspace
- [x] `D` next workspace
- [x] `Space` repeat last navigation
- [x] `Tab` switch display mode
- [x] `?` toggle debug/help view
- [x] `Q` quit

### Vocabulary

- [x] JSON vocabulary book format
- [x] Local `assets/vocabulary/ielts.json`
- [x] Committed example `assets/vocabulary/ielts.example.json`
- [x] Validation for book and word fields
- [x] Local large vocabulary ignored by Git

### Progress

- [x] Save current word index
- [x] Restore current word index
- [x] Resolve progress path from project root

### Workspace

- [x] Display 3 words per workspace
- [x] Move between word groups
- [x] English / Chinese / Both display modes
- [x] English-only default for better disguise

### UI

- [x] Build-log style default theme
- [x] Main screen looks like cached build output
- [x] Help view replaces the main screen instead of appending below it
- [x] Help view is disguised as runtime diagnostics

## Current Vocabulary Format

The current app only requires each word to have:

- `english`
- `chinese`

Reserved optional fields:

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

These fields are kept for later Settings and display modes. They should stay empty for now if not needed.

See:

```txt
docs/vocabulary-format.md
```

## Design Decisions

### Terminal First

Touch Fish runs inside the terminal.

It should not draw fake application windows, IDE borders, or VS Code-like layouts. The terminal already provides the window. Touch Fish should only generate believable terminal content.

Good theme directions:

- CLI build log
- Git output
- Cargo output
- Docker output
- Backend service logs
- Claude Code style terminal output
- Python REPL
- SQL console

Avoid:

- Electron
- IDE window simulation
- VS Code sidebar simulation
- Decorative UI cards

### Workspace

Current workspace size:

```txt
3 words
```

Future Settings can support:

- 1 word
- 3 words
- 5 words

### Help View

The main screen should hide learning context.

The `?` view can show progress, mode, and shortcut information, but it should be disguised as runtime diagnostics.

## Next Milestone Candidates

Recommended order:

1. Update documentation to match current implementation.
2. Keep polishing the build-log disguise if needed.
3. Prepare Settings model design for v0.3, without implementing Settings UI yet.
4. Later: multiple vocabulary books.
5. Later: Read Mode.

## Development Principles

- Small steps.
- One clear goal at a time.
- Do not implement future-stage features early.
- Do not redesign the architecture.
- Keep one file focused on one responsibility.
- Run the project after changes.
- Commit after each stable milestone.

# Touch Fish Design

> Version: v0.2-dev

Touch Fish doesn't hide your study. It disguises it as work.

## 1. Design Philosophy

Touch Fish should become part of a developer's terminal workflow.

The goal is not to build a traditional vocabulary app. The goal is to make short learning sessions feel natural inside development time.

## 2. Core Principles

### Stealth First

The first product requirement is disguise.

At a glance, the screen should look like normal terminal output from a development tool.

### Terminal First

Touch Fish always runs inside the terminal.

The app should not draw fake IDE windows, VS Code borders, sidebars, or desktop UI.

The terminal already provides the window. Touch Fish should generate believable content inside that window.

### Keyboard Only

All current interactions should work from the keyboard.

Mouse interaction is not part of v0.2.

### Small Sessions

Touch Fish should work for small fragments of time.

The user should be able to open a word session, move through a few word groups, and quit without breaking their coding flow.

### State Persistence

Touch Fish should remember local progress.

Current state:

- Current word index

Future state:

- Display mode
- Workspace size
- Theme
- Active vocabulary book

## 3. Command Model

Touch Fish has one project entry:

```powershell
touchfish
```

Current command:

```powershell
touchfish word
```

Future commands:

```powershell
touchfish read
touchfish setting
touchfish review
```

Each command should enter one clear session.

## 4. Word Workspace

The Word Session uses a workspace model.

It does not show only one word by default. It shows one small group of words.

Current default:

```txt
3 words
```

Future Settings can support:

- 1 word
- 3 words
- 5 words

## 5. Display Mode

Current display modes:

- English + Chinese
- English Only
- Chinese Only

The default should favor disguise. English-only output is less obvious in a development terminal than Chinese definitions.

The user can press `Tab` to rotate display modes.

Future display concepts:

- Example
- Mask
- Review
- Phonetic
- Part of speech

These belong to later stages.

## 6. UI Style

The default v0.2 style is a CLI build-log disguise.

Example direction:

```txt
[INFO] compiling workspace...
[INFO] resolving dependency graph...
[INFO] loading cached transform results...

cache entries by path ./src/cache/
  cache/007.ts   "abandon"    [built] 647 bytes
  cache/008.ts   "benefit"    [built] 648 bytes
  cache/009.ts   "complex"    [built] 649 bytes

[INFO] emitted 3 cache entries
[INFO] watching for file changes...
runtime: idle
>
```

The output does not need to fool someone reading carefully next to the screen. It should be believable from a normal distance and should not immediately look like a learning app.

## 7. Help View

The `?` view should replace the main screen.

It should not append below the main screen, because that makes the terminal feel cluttered and exposes too much at once.

It can show:

- Progress
- Entries per workspace
- Current bindings
- Current runtime state

But the wording should stay disguised as diagnostics.

## 8. Theme Direction

Themes should be terminal output styles, not desktop app skins.

Good future themes:

- Build Log
- Git
- Cargo
- Docker
- Backend Service Log
- Claude Code style terminal output
- Python REPL
- SQL Console

Avoid:

- VS Code full-window simulation
- JetBrains full-window simulation
- Fake sidebars
- Fake title bars
- Electron-style UI

## 9. Vocabulary Design

Current v0.2 vocabulary file:

```txt
assets/vocabulary/ielts.json
```

The real local vocabulary file is ignored by Git.

Current required fields:

- `english`
- `chinese`

Reserved optional fields:

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

The optional fields exist so the format can grow later without changing every word record.

## 10. Future Stages

### v0.3 Customization

- Settings file
- Workspace size
- Theme selection
- Default display mode
- Study order
- Active vocabulary book
- Key bindings

### v0.4 Content

- Larger vocabulary management
- Multiple vocabulary books
- Import support
- Read Mode

### v0.5 Daily Use

- Favorites
- Wrong words
- Review
- Statistics
- Daily learning records

## 11. Development Rule

Any stage should only complete that stage's goals.

If a feature belongs to a later version, keep the idea in documentation and do not implement it early.

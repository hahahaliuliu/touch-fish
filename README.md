# Touch Fish

Touch Fish is a Terminal Learning Tool.

It is not a normal vocabulary app. It helps users learn inside a terminal while making the output look like ordinary development work.

Core idea:

> Touch Fish doesn't hide your study. It disguises it as work.

## Current Stage

Touch Fish is currently in `v0.2 Product Experience`.

The current focus is not adding many new features. The focus is making the word workspace stable, usable, and believable as terminal output.

## Quick Start

Requirements:

- Node.js
- npm

Clone the project:

```powershell
git clone <your-repo-url>
cd "Touch Fish"
```

Install dependencies:

```powershell
npm install
```

Create the local vocabulary file:

```powershell
Copy-Item assets\vocabulary\ielts.example.json assets\vocabulary\ielts.json
```

Start the Word Session:

```powershell
npm run dev -- word
```

Optional: link the local CLI command:

```powershell
npm link
touchfish word
```

After `npm link`, `touchfish word` can be used from other directories.

## First-Time Setup Notes

`assets/vocabulary/ielts.json` is required at runtime, but it is ignored by Git.

This is intentional. Real vocabulary books can be large or personal, so the repository only commits:

```txt
assets/vocabulary/ielts.example.json
```

If the app says `Vocabulary file not found`, copy the example file again:

```powershell
Copy-Item assets\vocabulary\ielts.example.json assets\vocabulary\ielts.json
```

## Run

During development:

```powershell
npm run dev -- word
```

After linking the local CLI:

```powershell
npm link
touchfish word
```

Run `npm link` from the project directory only once:

```powershell
cd "D:\Touch Fish"
npm link
```

After that, `touchfish word` can be used from other directories.

## Current Features

- CLI entry
- `touchfish word`
- Word Session
- Keyboard navigation
- Workspace with 3 words per page
- Display modes: English, Chinese, English + Chinese
- JSON vocabulary book
- Local progress saving
- Terminal build-log disguise theme
- Debug/help view with hidden learning context

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

The local vocabulary book is:

```txt
assets/vocabulary/ielts.json
```

This file is ignored by Git because real vocabulary books can be large.

The committed example file is:

```txt
assets/vocabulary/ielts.example.json
```

See:

```txt
docs/vocabulary-format.md
```

## Project Structure

```txt
src/
  commands/   CLI command entry
  session/    Session lifecycle
  services/   Business logic
  storage/    Local persistence
  models/     Data models
  config/     Default config and paths
  ui/         Terminal rendering and themes

assets/
  vocabulary/ Vocabulary books
  progress/   Local progress

docs/         Project notes and future plans
```

## Not Doing Now

- Electron
- Login
- Cloud sync
- AI features
- Database
- Settings UI
- Multiple vocabulary switching
- Reading mode

These belong to later stages.

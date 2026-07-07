# Touch Fish - Project State

> Last Updated: 2026-07

---

# Project Overview

Touch Fish is a stealth terminal-based learning tool.

The goal is not to hide studying, but to disguise it as normal development work.

Current focus:
- Word Learning Workspace

Future modules:
- Reading Mode
- Settings
- Theme
- Multiple Vocabulary Libraries

---

# Current Architecture

src/

├── commands        // CLI commands

├── session         // Session lifecycle

├── ui              // Terminal rendering

├── services        // Business logic

├── storage         // Local persistence

├── models          // Data models

├── config          // Default configuration

└── assets          // Vocabulary & progress

---

# Completed Features

## CLI

- [x] touchfish word

## Word Session

- [x] Start session
- [x] Keyboard interaction
- [x] Quit session

## Keyboard

- [x] A Previous Workspace
- [x] D Next Workspace
- [x] Space Repeat Last Navigation
- [x] Tab Switch Display Mode
- [x] ? Toggle Help
- [x] Q Quit

## Vocabulary

- [x] JSON vocabulary loader
- [x] Local vocabulary file

## Workspace

- [x] Display 3 words per workspace
- [x] Switch workspace
- [x] English / Chinese / Both mode

## Progress

- [x] Auto save
- [x] Auto restore

---

# Design Decisions

## Workspace

Current workspace size:

3 words

Future:

- 1 word
- 3 words
- 5 words

Configurable in Settings.

---

## Help Panel

Normal interface hides learning information.

Press '?' to display:

- Vocabulary
- Progress
- Display Mode
- Shortcuts

---

## UI Style

Main interface should look like a development tool.

Avoid obvious learning UI.

---

# Next Milestone

Priority:

1. Improve Workspace UI
2. Better terminal disguise
3. Settings
4. Large vocabulary library
5. Reading mode

---

# Git Milestones

bootstrap CLI

↓

Word Session

↓

Keyboard

↓

Vocabulary Loader

↓

Word Service

↓

Progress Save

↓

Renderer

↓

Workspace

↓

Workspace Config

---

# Notes

Current project status is stable.

Architecture is considered complete for v0.1.

Future work should focus on product experience instead of infrastructure.
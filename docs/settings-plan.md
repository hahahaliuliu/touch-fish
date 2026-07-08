# Settings Plan

> Status: draft for future v0.3 work.

This document stores product ideas for Settings. These ideas should not be implemented during v0.2 unless the current milestone changes.

## Goal

Settings should let Touch Fish adapt to the user's learning style while keeping the main workflow simple and stealthy.

v0.2 focuses on product experience and the default word workspace.

v0.3 can start implementing Settings.

## Planned Settings

### Daily Word Count

Choose how many new words to study each day.

Possible values:

- 10
- 20
- 30
- custom

Notes:

- This is different from workspace size.
- Daily word count controls the learning plan.
- Workspace size controls how many words appear on one screen.

### Study Order

Choose how words are ordered.

Possible values:

- `sequential`
- `random`

Notes:

- `sequential` follows the vocabulary book order.
- `random` should generate and save a stable shuffled order.
- Random mode should avoid repeated words before the current round is complete.

### Vocabulary Book

Choose which vocabulary book to use.

Future behavior:

- Each vocabulary book can be a separate JSON file under `assets/vocabulary/`.
- Settings can store the active vocabulary book id or file path.
- Progress should be stored per vocabulary book.

Current v0.2 behavior:

- Only `assets/vocabulary/ielts.json` is loaded.

### Custom Key Bindings

Allow users to customize keyboard controls.

Current default controls:

- `A`: previous workspace
- `D`: next workspace
- `Space`: repeat last navigation
- `Tab`: switch display mode
- `?`: toggle debug/help view
- `Q`: quit

Future examples:

- Change navigation keys.
- Change help key.
- Change quit key.

### Word Detail Fields

Choose whether to display optional word fields.

Fields:

- phonetic
- example
- partOfSpeech
- note
- tags

Notes:

- These fields exist in the vocabulary format as placeholders.
- v0.2 should not display them by default.
- Later settings can decide whether these fields appear in the main view, detail view, or debug view.

### Disguise Theme

Choose the interface disguise style.

Possible themes:

- `build-log`
- `backend-log`
- `code-editor`
- `cursor`

Notes:

- `build-log` is the current default.
- Other themes should not be implemented until the theme system is ready.
- Theme switching belongs to Settings, not the current v0.2 workspace polish.

## Possible Settings File

Future file:

```txt
assets/settings.json
```

Possible shape:

```json
{
  "dailyWordCount": 20,
  "workspaceSize": 3,
  "studyOrder": "sequential",
  "activeVocabularyBook": "ielts-basic",
  "displayMode": "english",
  "theme": "build-log",
  "visibleFields": {
    "phonetic": false,
    "example": false,
    "partOfSpeech": false,
    "note": false,
    "tags": false
  },
  "keyBindings": {
    "previous": "a",
    "next": "d",
    "repeat": "space",
    "switchDisplayMode": "tab",
    "toggleHelp": "?",
    "quit": "q"
  }
}
```

## Implementation Order

Recommended v0.3 order:

1. Create settings model and default settings.
2. Load settings from local JSON with fallback defaults.
3. Support `workspaceSize`.
4. Support `displayMode`.
5. Support `studyOrder`.
6. Support active vocabulary book.
7. Support visible word fields.
8. Support disguise theme.
9. Support custom key bindings.

## Not Yet

Do not implement these during v0.2:

- Settings UI
- Theme switching
- Multiple vocabulary book switching
- Daily learning scheduler
- Custom key binding runtime

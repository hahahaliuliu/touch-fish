# Vocabulary Format

Touch Fish v0.2 uses one local default vocabulary book:

```txt
assets/vocabulary/ielts.json
```

This local file is ignored by Git because real vocabulary books can be large.

The committed example file is:

```txt
assets/vocabulary/ielts.example.json
```

To set up a local vocabulary book, copy the example file to `ielts.json` and replace the words:

```txt
assets/vocabulary/ielts.example.json -> assets/vocabulary/ielts.json
```

## Book Shape

The file is a JSON object. It contains book metadata and a `words` list.

```json
{
  "id": "ielts-basic",
  "name": "IELTS Basic",
  "description": "Default vocabulary book for Touch Fish word workspace.",
  "language": {
    "source": "en",
    "target": "zh-CN"
  },
  "version": 1,
  "words": [
    {
      "english": "abandon",
      "chinese": "放弃；遗弃",
      "phonetic": "",
      "example": "",
      "partOfSpeech": "",
      "note": "",
      "tags": []
    }
  ]
}
```

## Required Fields

Book fields:

- `id`
- `name`
- `version`
- `language.source`
- `language.target`
- `words`

Word fields:

- `english`
- `chinese`

## Reserved Optional Word Fields

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

These fields are placeholders for later stages. They can stay empty in v0.2.

`target` is not part of speech. It means the target language, such as `zh-CN`.

Part of speech belongs to each word and should use `partOfSpeech`.

## Current v0.2 Behavior

- Touch Fish reads only `assets/vocabulary/ielts.json`.
- `assets/vocabulary/ielts.example.json` is only a template.
- The word workspace uses `english` and `chinese`.
- Optional fields are saved for later Settings and display modes.
- Empty strings and empty arrays are valid placeholders.
- Multiple vocabulary books and import commands are not implemented yet.

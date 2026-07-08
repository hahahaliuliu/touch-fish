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

Required word fields:

- `english`
- `chinese`

Optional word fields:

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

Language fields:

- `source`: source language, such as `en`
- `target`: target language, such as `zh-CN`

`target` is not part of speech. Part of speech belongs to each word and should use `partOfSpeech`.

Current v0.2 behavior:

- Touch Fish reads only `assets/vocabulary/ielts.json`.
- `assets/vocabulary/ielts.example.json` is only a template.
- The word workspace uses `english` and `chinese`.
- Other fields are saved for later product stages.
- Empty strings and empty arrays are valid placeholders.
- Multiple vocabulary books and import commands are not implemented yet.

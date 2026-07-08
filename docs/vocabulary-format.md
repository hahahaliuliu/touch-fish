# Vocabulary Format / 词库格式

Touch Fish v0.2 当前只读取一本本地默认词库：

```txt
assets/vocabulary/ielts.json
```

这个文件会被 Git 忽略，因为真实词库可能很大，也可能是用户自己整理的内容。

仓库里提交的是示例词库：

```txt
assets/vocabulary/ielts.example.json
```

第一次使用时，把示例词库复制成本地词库：

```txt
assets/vocabulary/ielts.example.json -> assets/vocabulary/ielts.json
```

PowerShell 命令：

```powershell
Copy-Item assets\vocabulary\ielts.example.json assets\vocabulary\ielts.json
```

## Book Shape / 词库结构

词库文件是一个 JSON 对象，里面包含词库信息和 `words` 单词列表。

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

## Required Fields / 必填字段

词库必填字段：

- `id`
- `name`
- `version`
- `language.source`
- `language.target`
- `words`

单词必填字段：

- `english`
- `chinese`

当前程序真正显示的也是这两个字段。

## Reserved Optional Word Fields / 预留字段

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

这些字段是给后续阶段预留的。v0.2 可以留空。

说明：

- `language.source` 是源语言，例如 `en`
- `language.target` 是目标语言，例如 `zh-CN`
- `target` 不是词性
- 词性应该放在单词自己的 `partOfSpeech` 字段里

## Current v0.2 Behavior / 当前行为

- Touch Fish 只读取 `assets/vocabulary/ielts.json`
- `assets/vocabulary/ielts.example.json` 只是模板
- Word Workspace 当前只使用 `english` 和 `chinese`
- 其他字段保留给 Settings 和未来显示模式
- 空字符串和空数组是合法占位
- 多词库和导入命令暂时还没有实现

# Vocabulary Format / 词库格式

Touch Fish 会扫描 `assets/vocabulary/` 中的 JSON 词书，并根据当前 Settings 的 `activeVocabularyBook` 选择对应的词书。

真实词书会被 Git 忽略，因为它们可能很大，也可能是用户自己整理的内容。

仓库里提交的是示例词库：

```txt
assets/vocabulary/ielts.example.json
```

当目录中没有真实词书时，Touch Fish 会自动使用示例词书，因此第一次启动不需要复制文件。

## Book Shape / 词库结构

词库文件是一个 JSON 对象，里面包含词库信息和 `words` 单词列表。

```json
{
  "id": "example-book",
  "name": "Example Vocabulary Book",
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

## Current Behavior / 当前行为

- Touch Fish 自动扫描 `assets/vocabulary/` 下的 `.json` 文件
- 真实词书会按内部 `id` 被识别，例如 `cet4`、`cet6`、`ielts-luran`
- 优先加载 `activeVocabularyBook` 指定的词书；如果该 id 不存在，则自动加载按文件名排序后的第一本可用词书
- `.example.json` 文件只在没有真实词书时作为启动回退
- 重复的词书 `id`、损坏 JSON 或缺少必填字段会阻止启动，并显示具体文件和原因
- 当前词书由 `activeVocabularyBook` 决定；可在 Settings 的 `Vocabulary Book` 项中切换，返回 Word Session 后立即生效
- 每本词书分别保存顺序位置、随机位置、随机顺序和显示模式
- Word Workspace 当前只使用 `english` 和 `chinese`
- 其他字段保留给 Settings 和未来显示模式
- 空字符串和空数组是合法占位
- TXT、CSV、PDF 导入命令暂时还没有实现

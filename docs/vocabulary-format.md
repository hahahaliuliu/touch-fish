# Vocabulary Format / 词库格式

Touch Fish 会扫描 `assets/vocabulary/` 中安装好的 JSON 词书，并根据当前 Settings 的 `activeVocabularyBook` 选择对应的词书。导入页面还支持把 JSON、TXT、CSV、PDF 文件转换并安装为词书。

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
- `note`
- `tags`

这些字段是词书可以携带的附加数据；当前 Word Session 只显示 `english` 和 `chinese`，其余字段可以留空。

说明：

- `language.source` 是源语言，例如 `en`
- `language.target` 是目标语言，例如 `zh-CN`

## Current Behavior / 当前行为

- Touch Fish 自动扫描 `assets/vocabulary/` 下的 `.json` 文件
- 真实词书会按内部 `id` 被识别，例如 `cet4`、`cet6`、`ielts-luran`
- 优先加载 `activeVocabularyBook` 指定的词书；如果该 id 不存在，则自动加载按文件名排序后的第一本可用词书
- `.example.json` 文件只在没有真实词书时作为启动回退
- 重复的词书 `id`、损坏 JSON 或缺少必填字段会阻止启动，并显示具体文件和原因
- 当前词书由 `activeVocabularyBook` 决定；可在 Settings 的 `Vocabulary Book` 项中切换，返回 Word Session 后立即生效
- 每本词书分别保存顺序位置、随机位置、随机顺序和显示模式
- Word Workspace 当前只使用 `english` 和 `chinese`
- 音标、例句、笔记和标签会随 JSON 词书保留，但当前不在 Settings 中配置，也不会显示
- 空字符串和空数组是合法占位
## Import File Formats / 导入文件格式

在 `Download Vocabulary` 页面选择 `Import Vocabulary File`，粘贴文件完整路径后可以导入以下格式：

### JSON

JSON 必须使用上面的完整词书结构。它会保留词书 id、名称和可选字段。

### TXT

TXT 每一行是一组英文和中文释义，支持以下分隔形式：

```txt
abandon	放弃；遗弃
benefit - 利益；好处
complex: 复杂的
```

空行与 `#` 开头的注释行会被忽略。每一行都必须同时包含英文和中文释义。

### CSV

CSV 支持两列无表头文件：

```csv
abandon,放弃；遗弃
benefit,利益；好处
```

也支持常见表头：`english/chinese`、`word/translation`，以及 `英文/中文`、`单词/释义`。CSV 中重复的英文单词会自动合并，只保留第一次出现的释义。

TXT 和 CSV 导入时，Touch Fish 会从文件名自动生成词书名称和 id，并只保留英文、中文两个必填字段。

### PDF

PDF 只支持带可复制文本的词书，并要求提取后的每行仍符合 TXT 的“英文 + 分隔符 + 中文”规则。图片扫描件、复杂双栏或表格 PDF 很可能无法可靠还原词条，程序会提示失败而不会写入半本词书。

PDF 导入不会保留原 PDF 的字体、版式或图片，只提取符合规则的单词文本。

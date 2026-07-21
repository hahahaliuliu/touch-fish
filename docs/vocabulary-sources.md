# Vocabulary Sources / 词库来源

Touch Fish 的完整本地词库不会提交到 Git。仓库只保留格式示例和来源说明，用户自己的词库保存在 `assets/vocabulary/` 中。

## ECDICT

当前本地生成的 CET-4、CET-6 词库以及 AWL 的英汉字段来自 ECDICT：

- Project: https://github.com/skywind3000/ECDICT
- License: MIT
- Source format: UTF-8 CSV
- Used fields: word, translation, phonetic, pos, tag, frq

ECDICT 是一份开源英汉词典数据库，包含考试标签、中文释义、音标、词性和语料库词频。

## Generated Local Books / 本地生成词书

### Luran IELTS Vocabulary

- File: `assets/vocabulary/ielts-luran.json`
- ID: `ielts-luran`
- Source: user-provided Luran IELTS learning material
- Distribution: local only; not included in the public repository

### CET-4 Vocabulary

- File: `assets/vocabulary/cet4.json`
- Selection: entries tagged `cet4`
- Word count: 3,846
- Order: alphabetical

### CET-6 Vocabulary

- File: `assets/vocabulary/cet6.json`
- Selection: entries tagged `cet6`
- Word count: 5,406
- Order: alphabetical

### IELTS Academic - AWL

- File: `assets/vocabulary/ielts-academic-awl.json`
- Word list: Academic Word List (AWL), Averil Coxhead
- Official source: https://www.wgtn.ac.nz/lals/resources/academicwordlist
- Contains all 570 official AWL headwords
- Ordered from Sublist 1 to Sublist 10
- Sublists 1-9 contain 60 word families each; Sublist 10 contains 30
- Chinese translation, phonetic and part-of-speech data comes from ECDICT

AWL 是面向学术英语学习的公认词表，并不是 IELTS 官方词书。IELTS 官方没有发布固定的高频词表，因此 Touch Fish 将它标记为适合 IELTS Academic 学习的 AWL 词书，不把它描述为官方 IELTS 词库。

## Conversion Rules / 转换规则

- Words without a Chinese translation are excluded
- Duplicate English entries are removed
- English words are normalized to lowercase
- Translation line breaks are converted to a single-line form
- Phonetic and part-of-speech fields are retained when available
- Example and note fields remain empty for later features
- AWL sublist information is retained in each word's `tags`

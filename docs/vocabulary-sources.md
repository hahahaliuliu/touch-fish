# Vocabulary Sources / 词库来源

用户自己的完整词库不会提交到 Git，保存在 `assets/vocabulary/` 中。仓库另外会在 `assets/downloads/` 保存可以公开再分发的下载词书，并附上来源和许可证说明。

## ECDICT

当前本地生成的 CET-4、CET-6 词库以及 AWL 的英汉字段来自 ECDICT：

- Project: https://github.com/skywind3000/ECDICT
- License: MIT
- Source format: UTF-8 CSV
- Used fields: word, translation, phonetic, pos, tag, frq

ECDICT 是一份开源英汉词典数据库，包含考试标签、中文释义、音标、词性和语料库词频。

## Generated Local Books / 本地生成词书

下面这些文件是开发者本机使用的本地词书，仍然不会提交到 Git。

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

## Public Download Books / 公开下载词书

`assets/downloads/` 中的五本公开词书同样来自 ECDICT，并按以下规则生成：

- `high-school-vocabulary.json`：全部有效的 `gk` 标签词条，按英文排序。
- 其余四本高频词书：按 ECDICT 的 `frq` 字段从高频到低频取前 1,500 个有效词条。
- 所有词书都移除没有中文释义或英文词形不规范的条目，并在每个单词的 `tags` 中保留来源、考试标签和频率信息。
- 这些是基于公开词典数据的学习筛选结果，不宣称为官方考试词表。

ECDICT 的 MIT 许可证副本位于 `assets/downloads/LICENSE-ECDICT.txt`。

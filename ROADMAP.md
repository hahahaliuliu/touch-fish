# Touch Fish 路线图与开发记录

> 这份文档记录已完成的版本、已确定的产品决策、后续版本计划和新增想法。

## 使用规则

- 出现新想法、修改计划或完成一个阶段时，更新本文件。
- 已确定的决定记录在对应版本，避免后续重复讨论或遗忘。
- 未确定的想法放入“远期想法”，不代表一定会实现。
- 版本范围可以调整；实现前以本文件中最新决定为准。

## 产品定位

Touch Fish 是一个伪装成开发活动的终端学习工具。

长期保留两个核心学习模块：

1. **Word**：隐藏着背单词。
2. **Read**：隐藏着看小说。

## 命令结构

### 已确定的核心结构

```text
touchfish
touchfish word
touchfish word -s
touchfish word -f
touchfish read
touchfish read -s
touchfish setting
```

- `touchfish`：显示核心命令和简要帮助。
- `touchfish word`：开始背单词。
- `touchfish word -s / --settings`：Word 专属设置。
- `touchfish word -f / --favorite`：查看收藏词汇。
- `touchfish read`：继续阅读上一次阅读的小说。
- `touchfish read -s / --settings`：Read 专属设置，计划在 v0.4 实现。
- `touchfish setting`：真正的全局设置，计划在 v0.5 实现。

原则：模块自己的功能使用模块参数，不继续增加一级命令；顶层只保留 Word、Read 和未来真正的全局 Settings。

## v0.2 — Product Experience（已完成并发布）

### Word 核心体验

- 单词分页、学习分组、分组循环。
- 顺序、倒序、随机与重新随机学习。
- 多词书切换，每本词书独立保存进度。
- 中英文界面和中英文单词显示。
- Build Log、Backend Log、Git 伪装主题。
- Help 页面和 Settings 页面。
- 备注隐藏、显示、编辑；长备注自动换行。
- 组内单词测试和测试结果。
- 全局单词收藏与收藏预览。

### 词书与可靠性

- 单词书下载、卸载，以及 JSON、TXT、CSV、PDF 导入。
- 词书进度、随机顺序、备注和收藏的本地保存。
- 损坏进度文件回退、原子写入和索引范围保护。
- Session 集成测试、Node.js CI、README、v0.2.0 Release。

### 已完成的 Word Settings

- 每页数量、学习组大小和分组开关。
- 翻页循环、学习顺序、当前词书。
- 界面语言、备注模式、伪装主题。
- 查看收藏、词书下载与导入。
- 可自定义快捷键。

## v0.3 — Read Core（开发中）

### 目标

先完成小说阅读的核心体验和命令层级；不要求普通用户已经能够通过界面导入小说。

### 已开始

- 建立 `feature/read` 分支。
- 整理 CLI：顶层帮助只展示 Word 和 Read。
- `touchfish word -s` 和 `touchfish word -f` 已接入现有功能。
- `touchfish read` 与 `touchfish read -s` 命令骨架已建立。
- 本地 UTF-8 TXT 小说读取已完成，并附带“赤兔之死-止战之殇”示例读物。
- 已建立当前小说与每本小说阅读字符位置的本地存储，并对损坏进度安全回退。
- 正文分页已支持中英文终端宽度、段落空行与按字符位置恢复页面。
- 已支持中文、英文和 `《标题》` 形式的章节识别；示例读物可识别为两个章节。

### 计划实现

- 阅读 Session、翻页与章节跳转操作。
- 再次运行 `touchfish read` 时自动续读。
- Build Log、Backend Log、Git 三种小说伪装界面。
- 阅读 Session、存储容错和集成测试。

### 本版本明确不做

- 小说导入界面。
- 书架、切换和删除小说的管理界面。
- `touchfish read -s` 的实际设置页面。
- 全局 `touchfish setting`。

## v0.4 — Read Setup & Module Settings（计划）

- 实现 `touchfish read -s / --settings`。
- 小说导入、书架、切换、删除和管理。
- 设计 Read 专属设置。
- 在 Read 设置中支持“每行字符数量”和“每页行数”；两项共同决定一页显示多少正文。
- 支持把一个章节按固定份数切分为阅读小节，例如每章分为 3 段；开启后 `W/S` 或上下键按小节跳转，而不是一次跳完整章。
- 整理 Word 专属设置界面和内容。
- 明确 Word 与 Read 各自拥有的配置边界。

## v0.5 — Global Settings（计划）

实现：

```text
touchfish setting
```

只处理真正被 Word 和 Read 共用的设置，不放模块专属配置。

候选内容（等待 v0.4 后确认）：

- 全局界面语言。
- 模块共用的默认主题或终端外观。
- 共用快捷键与退出行为。
- 未来新增学习模块可继承的通用配置。

## 远期想法（未决定）

- 每日学习计划。
- 音标、例句、标签等词书附加字段的展示。
- 更多伪装主题，例如 Cargo、Docker、Python REPL、SQL Console。
- 错题记录、复习模式和长期学习统计。
- 更丰富的单词测试形式。
- 小说章节识别、书签、搜索、段落收藏。
- 支持更多小说文件格式。

## 开发记录

- v0.2 已完成并发布。
- v0.3 从命令结构和 Read 核心开始。
- 旧的 `docs/settings-plan.md` 曾记录 v0.2 的 Word Settings 设想；其中大部分已实现或已不符合当前版本规划，现由本文件取代。

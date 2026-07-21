# Settings Plan / 设置功能草稿

> Status: v0.3 进行中。当前已经完成 Settings 基础、可编辑设置界面、学习分组、顺序/随机模式、显示模式保存、主题切换和双键槽快捷键配置。多单词书、单词详情字段和测试功能尚未完成。

这个文档用来保存 Settings 的产品想法，防止以后忘记。

当前 Settings 应该小步实现：先支持真正会影响学习流程的设置，再逐步完善界面体验。

## Goal / 目标

Settings 应该让 Touch Fish 适应用户自己的学习习惯，同时保持主流程简单、低调、稳定。

## Planned Settings / 计划中的设置

### Study Group Size / 学习组大小

选择一个学习组包含多少个单词。

可能选项：

- 10
- 20
- 30
- custom

注意：

- 当前代码中的字段名仍是 `dailyWordCount`，但实际行为是学习组大小
- Workspace Size 控制一页显示几个单词，Study Group Size 控制一个学习范围包含多少单词
- 真正按日期计算的“每日学习计划”尚未实现，后续实现时应使用独立概念，避免与学习组混淆

### Workspace Size / 每组单词数

选择每个 Workspace 页面显示几个单词。

当前已支持：

- 1
- 3
- 5
- custom positive whole number

注意：

- 这个设置影响 `A` / `D` 每次切换时移动多少个单词
- 当前默认值是 3
- 它不是“每天背多少个单词”，只是“当前屏幕一次显示多少个单词”

### Study Order / 学习顺序

选择单词出现顺序。

可能选项：

- `sequential` 顺序
- `random` 随机

注意：

- `sequential` 按词库顺序学习
- `random` 对整本词书生成并保存一份稳定随机顺序，再按学习组和页面拆分
- `sequential` 与 `random` 分别保存自己的当前位置；切换模式不会覆盖另一种模式的进度
- 随机顺序在同一本词书不变时会保留
- Settings 中的 `reshuffle` 是受确认保护的操作：确认后生成新的随机顺序，并将随机模式进度重置到开头；顺序模式进度不会受影响

### Navigation Loop / 头尾循环

选择到达词库开头或结尾时，继续导航是否循环。

可能选项：

- `false` 不循环：到第一组后继续按上一组仍停在第一组；到最后一组后继续按下一组仍停在最后一组
- `true` 循环：第一组按上一组跳到最后一组；最后一组按下一组跳到第一组

当前行为：

- 默认不循环
- 已放进 Settings UI，可切换 on / off

注意：

- 这个设置以后可以叫 `navigationLoop`
- 不循环更适合新手，因为不会误以为前几个单词丢了
- 循环适合复习模式或熟悉键位之后使用

### Workspace Navigation / 学习组导航

当前已实现的 Workspace 规则：

- `studyGroupEnabled` 决定是否把词书拆成学习组，默认开启
- `dailyWordCount` 表示一个学习组包含多少单词，默认是 20
- `workspaceSize` 表示每页显示多少单词，支持 `1 / 3 / 5` 预设值和任意正整数
- 开启分组时，`A` / `D` 只在当前学习组内翻页，`[` / `]` 切换上一组或下一组
- 关闭分组时，整本词书作为一个连续范围，`[` / `]` 不执行切换
- `navigationLoop` 在当前导航范围内生效：分组开启时是组内循环，关闭时是整本词书循环

例如学习组大小为 20、每页显示 3 个单词时，第一组范围为 001-020；
`A` / `D` 在这个范围内移动，`[` / `]` 才会切换到 021-040 等其他组。

### Vocabulary Book / 单词书

选择当前使用哪一本单词书。

当前已支持：

- 每本单词书可以是 `assets/vocabulary/` 下的一个 JSON 文件
- 程序会自动扫描并验证词书，优先按 `activeVocabularyBook` 的词库 id 加载；找不到时回退到第一本可用词书
- 没有真实词书时会回退到 `.example.json` 示例词书

当前行为：

- Settings 的 `Vocabulary Book` 会列出自动扫描到的词书 id；编辑时用 `A` / `D` 或左右方向键切换，按 `Enter` 保存
- 返回 Word Session 后会立即加载新词书，不需要重新启动程序
- 每本词书在 `assets/progress/` 下拥有独立进度文件，分别保存顺序位置、随机位置、随机顺序和显示模式
- 旧版唯一的 `word-progress.json` 会在升级后的第一次启动时迁移为当前词书的进度文件，避免丢失原有进度

### Custom Key Bindings / 自定义快捷键

允许用户自定义键盘控制。

当前已经支持：

- 每个可配置操作提供两个按键槽位
- `W` / `S` 或上下方向键选择操作，`A` / `D` 或左右方向键选择槽位
- `Enter` 进入按键捕获，`Backspace` 清空槽位，`Esc` 取消
- 新按键如果已被其他操作占用，会从旧槽位中自动移除，避免冲突
- 英文字母不区分大小写，支持英文半角字符；中文全角 `？` 会按 `?` 处理
- `Q`、`Ctrl+O`、`Enter` 和 `Esc` 属于安全保留键，不开放自定义

当前默认快捷键：

- `A` / `←`: 当前范围内上一页
- `D` / `→`: 当前范围内下一页
- `[` / `↑`: 上一学习组
- `]` / `↓`: 下一学习组
- `Space`: 重复上一次导航
- `Tab`: 切换显示模式
- `Ctrl+O`: 打开 Settings 或返回 Word
- `?`: 切换 Help 视图
- `Q`: 退出

当前可修改上一页、下一页、上一组、下一组、重复导航、切换显示和 Help 的按键。退出与返回操作暂时保持固定，避免用户误操作后无法离开界面。

### Word Test / 单词测试

单词测试属于后续学习功能，不在当前 Workspace 阶段提前实现。

未来可以支持：

- 单词测试：围绕单个单词进行释义、拼写或选择题测试
- 小组测试：使用当前学习组作为题目范围
- 测试方向：English -> Chinese、Chinese -> English、拼写
- 题目数量：使用当前组全部单词，或设置一个自定义数量
- 测试结果：正确、错误、跳过；后续可接入错题和 Review

未来 Settings 可以保存：

- 默认测试类型：单词测试 / 小组测试
- 默认测试方向
- 是否显示例句、音标或词性作为提示

注意：测试结果、错题和统计属于后续 Daily Use 阶段，当前只保留设计位置。

### Word Detail Fields / 单词详情字段

选择是否显示一些额外字段。

字段：

- phonetic 音标
- example 例句
- partOfSpeech 词性
- note 笔记
- tags 标签

注意：

- 这些字段已经在词库格式中预留
- v0.2 默认不显示
- 以后 Settings 可以决定这些字段显示在主界面、详情视图，还是 Debug/Help 视图中

### Terminal Theme / 终端主题

选择终端输出风格。

可能主题：

- `build-log`
- `backend-log`
- `git`
- `cargo`
- `docker`
- `claude-code`
- `python-repl`
- `sql-console`

注意：

- `build-log` 是当前默认主题
- `build-log` 和 `backend-log` 已经可以在 Settings 中切换并保存
- 其他主题等 Theme 系统更稳定后再逐步增加
- Theme 切换属于 v0.3 Settings 功能
- Theme 应该模拟终端输出，而不是完整桌面应用窗口或 IDE 布局

## Possible Settings File / 未来设置文件

当前本地设置文件：

```txt
assets/settings.json
```

这个文件会被 Git 忽略，因为它属于每个用户自己的本地偏好。

提交到 Git 的示例文件：

```txt
assets/settings.example.json
```

未来完整结构草稿：

> 注意：下面不是当前全部可用的配置。除 `visibleFields` 尚未接入实际功能外，其余字段已经在当前 Settings 流程中使用。

```json
{
  "dailyWordCount": 20,
  "workspaceSize": 3,
  "studyGroupEnabled": true,
  "navigationLoop": false,
  "studyOrder": "sequential",
  "activeVocabularyBook": "ielts-luran",
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
    "previous": ["a", "arrow-left"],
    "next": ["d", "arrow-right"],
    "previousGroup": ["[", "arrow-up"],
    "nextGroup": ["]", "arrow-down"],
    "repeat": ["space", ""],
    "switchDisplayMode": ["tab", ""],
    "toggleHelp": ["?", ""],
    "quit": ["q", ""]
  }
}
```

## Implementation Order / 推荐实现顺序

v0.3 推荐顺序：

1. 创建 settings model 和默认设置 `[done]`
2. 从本地 JSON 读取 settings，没有文件时使用默认值 `[done]`
3. 支持 `workspaceSize` `[done]`
4. 支持默认 `displayMode` `[done]`
5. 增加 `touchfish setting` 只读设置视图 `[done]`
6. 支持在 `touchfish setting` 中修改 `workspaceSize` `[done]`
7. 支持自定义 `workspaceSize` 和 `dailyWordCount` `[done]`
8. 支持 `studyGroupEnabled` `[done]`
9. 支持 `dailyWordCount` 作为学习组大小 `[done]`
10. 支持 `navigationLoop` `[done]`
11. 支持 `studyOrder` `[done]`
12. 支持识别并加载当前词库 `[done: discovery/loading]`
13. 支持在 Settings 中选择词库 `[done]`
14. 支持词库独立学习进度 `[done]`
15. 支持可见字段配置
16. 支持终端主题 `[done: build-log / backend-log]`
17. 支持自定义快捷键 `[done]`

## Not Yet / 当前暂不做

当前先不急着实现：

- 每日学习计划
- 单词详情字段显示
- 单词测试和小组测试
- 更多终端主题

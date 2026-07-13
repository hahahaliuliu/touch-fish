# Settings Plan / 设置功能草稿

> Status: v0.3 已开始。当前已经完成 Settings model、默认设置、本地 settings 读取基础，以及初版设置界面。

这个文档用来保存 Settings 的产品想法，防止以后忘记。

当前 Settings 应该小步实现：先支持真正会影响学习流程的设置，再逐步完善界面体验。

## Goal / 目标

Settings 应该让 Touch Fish 适应用户自己的学习习惯，同时保持主流程简单、低调、稳定。

## Planned Settings / 计划中的设置

### Daily Word Count / 每日单词数

选择每天学习多少个新单词。

可能选项：

- 10
- 20
- 30
- custom

注意：

- Daily Word Count 控制每天学习计划
- Workspace Size 控制一页显示几个单词
- 这两个不是同一个概念

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
- 随机顺序在同一本词书不变时会保留，之后可以增加“重新随机并从头开始”的操作

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

未来行为：

- 每本单词书可以是 `assets/vocabulary/` 下的一个 JSON 文件
- Settings 可以保存当前启用的词库 id 或文件路径
- 学习进度应该按词库分别保存

当前 v0.2 行为：

- 只读取 `assets/vocabulary/ielts.json`

### Custom Key Bindings / 自定义快捷键

允许用户自定义键盘控制。

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

未来可以支持：

- 修改导航键
- 修改 Help 键
- 修改退出键

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
- 其他主题等 Theme 系统更稳定后再做
- Theme 切换属于 Settings，不属于当前 v0.2 的 Workspace 打磨
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

> 注意：下面不是当前全部可用的配置。当前已经可用的是 `studyGroupEnabled`、`dailyWordCount`、`workspaceSize`、`navigationLoop` 和 `studyOrder`，其他字段会按实现顺序逐步接入。

```json
{
  "dailyWordCount": 20,
  "workspaceSize": 3,
  "studyGroupEnabled": true,
  "navigationLoop": false,
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
12. 支持选择当前词库
13. 支持可见字段配置
14. 支持终端主题
15. 支持自定义快捷键

## Not Yet / 当前暂不做

当前先不急着实现：

- Theme switching
- 多词库切换
- 每日学习计划
- 自定义快捷键运行时配置

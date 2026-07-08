# Settings Plan / 设置功能草稿

> Status: v0.3 已开始。当前已经完成 Settings model、默认设置和本地 settings 读取基础。

这个文档用来保存 Settings 的产品想法，防止以后忘记。

当前不要提前实现 Settings UI。先把设置数据结构和读取逻辑稳定下来。

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

### Study Order / 学习顺序

选择单词出现顺序。

可能选项：

- `sequential` 顺序
- `random` 随机

注意：

- `sequential` 按词库顺序学习
- `random` 应该生成并保存一个稳定的随机顺序
- 随机模式应避免一轮没结束就重复出现太多旧词

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

- `A`: 上一组
- `D`: 下一组
- `Space`: 重复上一次导航
- `Tab`: 切换显示模式
- `?`: 切换 Debug/Help 视图
- `Q`: 退出

未来可以支持：

- 修改导航键
- 修改 Help 键
- 修改退出键

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

结构：

```json
{
  "dailyWordCount": 20,
  "workspaceSize": 3,
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
7. 支持 `studyOrder`
8. 支持选择当前词库
9. 支持可见字段配置
10. 支持终端主题
11. 支持自定义快捷键

## Not Yet / 当前不做

v0.2 不要实现：

- 可修改的 Settings UI
- Theme switching
- 多词库切换
- 每日学习计划
- 自定义快捷键运行时配置

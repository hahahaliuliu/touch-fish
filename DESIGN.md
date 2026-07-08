# Touch Fish Design / 设计文档

> Version: v0.2-dev

Learn in the gaps. Stay in the terminal.

## 1. Design Philosophy / 设计理念

Touch Fish 应该成为开发者终端工作流的一部分。

它不是传统背单词软件。它的目标是在不打断开发环境的情况下，让用户利用等待构建、等待工具响应、等待任务执行等碎片时间学习。

## 2. Core Principles / 核心原则

### Low-Key First / 低调优先

低调是第一产品要求。

远处或快速扫一眼时，界面应该像正常开发工具的终端输出，而不是传统学习软件。

### Terminal First / 终端优先

Touch Fish 始终运行在终端中。

不要画假的 IDE 窗口、VS Code 边框、侧边栏或桌面 UI。

终端本身已经提供窗口。Touch Fish 只负责在窗口里生成可信的终端内容。

### Keyboard Only / 键盘优先

当前交互都应该通过键盘完成。

鼠标交互不属于 v0.2。

### Small Sessions / 碎片使用

Touch Fish 应该适合短时间使用。

用户可以打开 Word Session，看几组单词，然后退出，不破坏原本的开发节奏。

### State Persistence / 状态保存

Touch Fish 应该记住本地状态。

当前保存：

- 当前单词位置

未来可以保存：

- Display Mode
- Workspace size
- Theme
- Active vocabulary book

## 3. Command Model / 命令模型

Touch Fish 的统一入口是：

```powershell
touchfish
```

当前命令：

```powershell
touchfish word
```

未来命令：

```powershell
touchfish read
touchfish setting
touchfish review
```

每个命令进入一个清晰的 Session。

## 4. Word Workspace / 单词工作区

Word Session 使用 Workspace 模型。

它默认不是一次只显示一个单词，而是显示一小组单词。

当前默认：

```txt
3 words
```

未来 Settings 可以支持：

- 1 word
- 3 words
- 5 words

## 5. Display Mode / 显示模式

当前显示模式：

- English + Chinese
- English Only
- Chinese Only

默认应优先考虑伪装。英文输出比中文释义更像开发终端里的内容。

用户可以按 `Tab` 循环切换显示模式。

未来可以增加：

- Example
- Mask
- Review
- Phonetic
- Part of speech

这些属于后续阶段。

## 6. UI Style / UI 风格

v0.2 默认风格是 CLI Build Log。

示例方向：

```txt
[INFO] compiling workspace...
[INFO] resolving dependency graph...
[INFO] loading cached transform results...

cache entries by path ./src/cache/
  cache/007.ts   "abandon"    [built] 647 bytes
  cache/008.ts   "benefit"    [built] 648 bytes
  cache/009.ts   "complex"    [built] 649 bytes

[INFO] emitted 3 cache entries
[INFO] watching for file changes...
runtime: idle
>
```

它不需要骗过贴着屏幕认真看的人。目标是从正常距离看，不要第一眼像传统学习软件。

## 7. Help View / 帮助视图

按 `?` 后，Help View 应该覆盖主界面。

不要追加在主界面下面，否则终端会显得混乱，也会暴露太多学习信息。

Help View 可以显示：

- 进度
- 每组数量
- 当前快捷键
- 当前运行状态

但文案应呈现为 diagnostics，而不是普通背单词软件的帮助面板。

## 8. Theme Direction / 主题方向

Theme 应该是终端输出风格，不是桌面应用皮肤。

适合的未来主题：

- Build Log
- Git
- Cargo
- Docker
- Backend Service Log
- Claude Code style terminal output
- Python REPL
- SQL Console

避免：

- 完整模拟 VS Code
- 完整模拟 JetBrains
- 假侧边栏
- 假标题栏
- Electron 风格 UI

## 9. Vocabulary Design / 词库设计

当前 v0.2 词库文件：

```txt
assets/vocabulary/ielts.json
```

真实本地词库不会提交到 Git。

当前必填字段：

- `english`
- `chinese`

预留字段：

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

保留这些字段，是为了以后扩展显示模式时不需要重写词库格式。

## 10. Future Stages / 后续阶段

### v0.3 Customization

- Settings file
- Workspace size
- Theme selection
- Default display mode
- Study order
- Active vocabulary book
- Key bindings

### v0.4 Content

- 大词库管理
- 多词库
- 导入支持
- Read Mode

### v0.5 Daily Use

- 收藏
- 错题
- Review
- Statistics
- 每日学习记录

## 11. Development Rule / 开发规则

任何阶段只完成该阶段目标。

如果一个功能属于后续版本，即使现在能做，也先写进文档，不提前实现。

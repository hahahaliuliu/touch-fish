# Touch Fish - Project State / 项目状态

> Last updated: 2026-07-08

## Product Position / 产品定位

Touch Fish 是一个 Terminal Learning Tool。

它是一个适合开发间隙使用的低调终端学习工具。

典型使用场景是：等待构建、等待工具响应、等待任务执行、上下文切换之间，顺手背几个单词，同时保持在终端工作流里。

核心理念：

> Learn in the gaps. Stay in the terminal.

中文理解：

> 在开发间隙学习，不离开终端。

## Current Stage / 当前阶段

当前里程碑：

```txt
v0.2 Product Experience
```

当前优先级：

1. 先保证项目稳定运行。
2. 优化 Word Workspace 的伪装效果。
3. 主界面尽量保持低调，不像传统学习软件。
4. 保持 Renderer 和 Theme 的职责分离。
5. Settings、多词库、Read Mode 放到后续版本。

## Current Architecture / 当前架构

```txt
src/
  commands/   CLI 命令入口
  session/    Session 生命周期
  ui/         终端渲染和主题
  services/   业务逻辑
  storage/    本地存储
  models/     数据模型
  config/     默认配置和项目路径

assets/
  vocabulary/ 词库
  progress/   本地进度

docs/         说明文档和未来计划
```

v0.2 阶段不要重写架构。保持小步修改，一个文件只负责一种职责。

## Run Commands / 运行命令

开发时：

```powershell
npm run dev -- word
```

本地 CLI：

```powershell
touchfish word
```

第一次使用本地 CLI，需要在项目目录执行：

```powershell
cd "D:\Touch Fish"
npm link
```

执行后，`touchfish word` 可以在其他目录使用。词库和进度路径会从项目根目录解析，不会跟着当前终端目录跑偏。

## Completed Features / 已完成功能

### CLI

- [x] `npm run dev -- word`
- [x] `touchfish word`
- [x] 无参数时显示帮助信息

### Word Session

- [x] 启动 Session
- [x] 退出 Session
- [x] 终端支持时使用 raw keyboard input
- [x] 支持简单管道输入，方便测试

### Keyboard / 快捷键

- [x] `A` 上一组
- [x] `D` 下一组
- [x] `Space` 重复上一次导航
- [x] `Tab` 切换显示模式
- [x] `?` 切换 Debug/Help 视图
- [x] `Q` 退出

### Vocabulary / 词库

- [x] JSON 词库格式
- [x] 本地词库 `assets/vocabulary/ielts.json`
- [x] 示例词库 `assets/vocabulary/ielts.example.json`
- [x] 词库格式校验
- [x] 本地大词库不提交到 Git

### Progress / 进度

- [x] 保存当前单词位置
- [x] 恢复当前单词位置
- [x] 从项目根目录解析进度文件路径

### Settings / 设置

- [x] Settings model
- [x] 默认设置 `DEFAULT_SETTINGS`
- [x] 本地 `assets/settings.json` 读取
- [x] 没有本地 settings 时自动使用默认设置
- [x] 示例设置文件 `assets/settings.example.json`
- [x] Word Session 使用 settings 中的 `workspaceSize`
- [x] Word Session 使用 settings 中的默认 `displayMode`
- [x] `touchfish setting` 只读设置视图
- [x] `touchfish setting` 支持编辑并保存 `workspaceSize`

### Workspace

- [x] 默认一页显示 3 个单词
- [x] 按组切换
- [x] 英文 / 中文 / 英文 + 中文显示模式
- [x] 默认英文显示，增强伪装效果

### UI

- [x] Build Log 风格默认主题
- [x] 主界面像缓存构建输出
- [x] Help 视图覆盖主界面，而不是追加在下面
- [x] Help 视图呈现为 runtime diagnostics

## Current Vocabulary Format / 当前词库格式

当前真正必填的单词字段只有：

- `english`
- `chinese`

预留字段：

- `phonetic`
- `example`
- `partOfSpeech`
- `note`
- `tags`

这些字段现在可以留空，后续 Settings 和更多显示模式再使用。

详细说明见：

```txt
docs/vocabulary-format.md
```

## Design Decisions / 设计决策

### Terminal First

Touch Fish 始终运行在终端里。

不要画假的应用窗口，不要模拟完整 IDE，不要做 VS Code 侧边栏。终端本身已经是窗口，Touch Fish 只负责生成像开发工具一样的终端内容。

适合的 Theme 方向：

- CLI Build Log
- Git output
- Cargo output
- Docker output
- Backend service logs
- Claude Code style terminal output
- Python REPL
- SQL console

避免：

- Electron
- 模拟 IDE 窗口
- 模拟 VS Code 侧边栏
- 装饰性 UI 卡片

### Workspace

当前 workspace size：

```txt
3 words
```

未来 Settings 可以支持：

- 1 word
- 3 words
- 5 words

### Help View

主界面应尽量保持低调。

`?` 视图可以显示进度、模式、快捷键等信息，但文案应呈现为 diagnostics，不要像普通背单词软件。

## Next Milestone Candidates / 下一步候选

推荐顺序：

1. 继续保持 Settings 小步开发。
2. 下一步可以让 `touchfish setting` 修改一个最小选项，例如 `workspaceSize`。
3. 后续实现多词库。
4. 后续实现 Read Mode。

## Development Principles / 开发原则

- 小步修改。
- 每次只完成一个明确目标。
- 不提前实现后续阶段功能。
- 不重写架构。
- 一个文件只负责一种职责。
- 修改后运行项目。
- 稳定后及时 commit。

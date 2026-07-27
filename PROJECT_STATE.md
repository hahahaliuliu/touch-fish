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
6. 核心设置、随机顺序和词书导入应保持自动测试覆盖。
7. 当前学习组测试已支持双向答题和错误单词结果页；错题保存与 Review 后续再做。

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
- [x] `?` 打开或关闭 Help 视图
- [x] `Q` 退出

### Vocabulary / 词库

- [x] JSON 词库格式
- [x] 本地词库 `assets/vocabulary/ielts-luran.json`
- [x] 示例词库 `assets/vocabulary/ielts.example.json`
- [x] 词库格式校验
- [x] 本地大词库不提交到 Git
- [x] 自动扫描 `assets/vocabulary/` 中的本地词书
- [x] Settings 中切换当前词书
- [x] Settings 中打开在线词库下载列表
- [x] 下载词书后校验并原子安装到本地词库目录
- [x] 下载列表统一管理已安装、可下载和手动导入词书
- [x] 卸载词书时删除本地文件和该书独立学习进度
- [x] 从导入页面读取 JSON、TXT、CSV、PDF 词书文件

### Progress / 进度

- [x] 保存当前单词位置
- [x] 恢复当前单词位置
- [x] 从项目根目录解析进度文件路径
- [x] 每本词书分别保存顺序、随机和显示模式进度
- [x] 兼容迁移旧版唯一进度文件

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
- [x] `touchfish setting` 支持自定义 `workspaceSize`
- [x] `touchfish setting` 支持开关学习分组 `studyGroupEnabled`
- [x] `touchfish setting` 支持编辑学习组大小 `dailyWordCount`
- [x] `touchfish setting` 支持自定义学习组大小
- [x] `touchfish setting` 支持 `navigationLoop`
- [x] `touchfish setting` 支持 `studyOrder`：顺序 / 随机
- [x] `touchfish setting` 支持选择 `activeVocabularyBook`

### Workspace

- [x] 默认一页显示 3 个单词
- [x] 按组切换
- [x] `[` / `]` 或 `↑` / `↓` 切换学习组
- [x] `A` / `D` 或 `←` / `→` 在当前范围内翻页
- [x] 可关闭分组，连续浏览整本词书
- [x] 分组内或整本词书循环导航
- [x] 顺序与随机模式分别保存进度
- [x] 随机模式保存稳定的整本词书随机顺序
- [x] 英文 / 中文 / 英文 + 中文显示模式
- [x] 默认英文显示，增强伪装效果

### UI

- [x] Build Log 风格默认主题
- [x] 主界面像缓存构建输出
- [x] Help 视图覆盖主界面，而不是追加在下面
- [x] Help 视图清楚显示快捷键和当前 Workspace 状态

## Current Vocabulary Format / 当前词库格式

当前真正必填的单词字段只有：

- `english`
- `chinese`

预留字段：

- `phonetic`
- `example`
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

已实现主题：

- build-log
- backend-log
- git

后续适合的 Theme 方向：

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
3 words by default; configurable in Settings
```

当前 Settings 已支持每页 `1 / 3 / 5 / custom` 个单词，
并支持学习分组、组大小、首尾循环和学习顺序。

### Help View

主界面应尽量保持低调。

`?` 视图可以显示进度、模式和快捷键等信息。当前阶段优先保证清楚易用。

## Next Milestone Candidates / 下一步候选

推荐顺序：

1. 继续保持 Settings 小步开发。
2. Settings、Help 和词书管理已支持 English / 中文界面切换；单词显示模式继续由 `Tab` 在 Word Session 中切换并保存。
3. 后续实现 Read Mode。

## Development Principles / 开发原则

- 小步修改。
- 每次只完成一个明确目标。
- 不提前实现后续阶段功能。
- 不重写架构。
- 一个文件只负责一种职责。
- 修改后运行项目。
- 稳定后及时 commit。

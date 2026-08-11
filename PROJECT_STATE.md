# Touch Fish - Project State / 项目状态

> Last updated: 2026-08-07

## Product Position / 产品定位

Touch Fish 是一个适合开发间隙使用的低调终端学习工具，将学习内容伪装成开发日志、构建输出和 Git 等终端内容。

核心理念：

> Learn in the gaps. Stay in the terminal.

长期保留两个核心模块：

- Word：隐藏着背单词。
- Read：隐藏着看小说。

## Current Stage / 当前阶段

- 正式发布版本：`v0.2.0`。
- 当前开发阶段：v0.4 Read Setup & Module Settings 正在开发，现有 Read 设置与管理功能已完成，但 v0.4 仍有新功能待增加。
- 当前分支：`feature/read-settings`。
- 当前分支尚未推送；推送、合并和发布需要用户明确确认。
- 当前工作区只有 `tmp/` 为未跟踪测试素材，不应提交。

## Run Commands / 运行命令

```powershell
npm run dev -- word
npm run dev -- word -s
npm run dev -- word -f
npm run dev -- read
npm run dev -- read -s
```

执行一次 `npm link` 后，也可以在任意目录使用：

```powershell
touchfish word
touchfish word -s
touchfish word -f
touchfish read
touchfish read -s
```

旧的 `touchfish setting` 和 `touchfish favorite` 只作为 v0.2 隐藏兼容别名保留。

## Current Architecture / 当前架构

```text
src/
  commands/   CLI 命令入口
  session/    交互 Session 生命周期
  ui/         终端渲染、主题和通用布局
  services/   业务逻辑
  storage/    本地设置与进度
  models/     数据模型
  config/     默认配置与项目路径

assets/
  vocabulary/     词书
  progress/       Word 进度
  notes/          本地单词备注
  reading/        本地 TXT 小说
  read-progress/  每本小说的阅读进度
```

继续保持 Renderer、Session、Service 和 Storage 的职责分离，不为新增功能重写现有架构。

## Completed Features / 已完成功能

### Word

- 分页、学习分组、分组循环，以及顺序、倒序、随机和重新随机学习。
- 多词书切换和每本词书独立进度。
- 中英文界面及多种单词显示方式。
- 当前学习组测试、错题详情和错题重测。
- 单词备注、收藏和收藏预览。
- JSON、TXT、CSV、PDF 词书导入，以及词书下载和卸载。
- Build Log、Backend Log、Git 伪装主题。
- Help、Word Settings 和可自定义双键位快捷键。

### Read

- `touchfish read` 继续阅读当前小说。
- 本地 UTF-8 TXT 阅读、中英文宽度适配分页、章节识别和每本小说独立进度。
- 损坏进度安全回退与临时文件替换写入。
- A/D 翻页、W/S 跳章、空格重复上次操作；开启章节切分后 W/S 按小节导航。
- 章节切分支持关闭、2/3/5 份和 2–20 自定义份数；边界只吸附到自然段开头。
- Build Log、Backend Log、Git 阅读伪装主题。
- Read Help 显示导航、操作、当前小说、页面、章节和小节状态。

### Read Settings 与小说管理

- 切换当前小说，设置正文宽度、每页行数和章节切分。
- Read 独立的界面语言、伪装主题和双键位快捷键。
- 从任意本地路径导入 UTF-8 TXT，导入后复制到 Touch Fish 本地阅读目录。
- 同名导入支持替换、保留两本或取消。
- 小说管理页列出全部已导入小说和示例小说。
- 删除小说前二次确认，同时删除对应进度；删除当前小说后自动选择下一本。

### Shared UI and Safety / 共用界面与安全性

- Read 设置遵循 Word 设置的选中、编辑、光标、按键捕获和操作提示规范。
- Word 与 Read 设置使用同一套响应式三列布局；列内容独立换行，窗口缩放后自动重排。
- `Ctrl+O`、Esc、Q 和 Ctrl+C 为固定控制键，不允许被普通快捷键占用。
- 从设置和素材管理页面直接退出时，清除当前画面和终端滚动历史。

## Local Data / 本地数据

以下用户数据均被 Git 忽略：

- `assets/settings.json`
- `assets/read-settings.json`
- `assets/progress/*.json`
- `assets/read-progress/*.json`
- `assets/notes/*.json`
- `assets/favorites.json`
- 用户导入的 `assets/vocabulary/*.json`
- 用户导入的 `assets/reading/*.txt`

仓库只保留 `.example.json` 和 `.example.txt` 示例素材。

## Testing / 测试

```powershell
npx tsc --noEmit
npm test
```

当前共 108 项自动测试，覆盖 CLI、Word、Read、设置渲染、响应式布局、快捷键、导入与删除、分页、章节与小节、进度容错和 Session 交互。

## Design Decisions / 设计决策

- Terminal first：不做 Electron，不模拟完整 IDE，不制作装饰性学习软件界面。
- 模块专属功能放在 `word` 或 `read` 参数中，不继续增加一级命令。
- Word 与 Read 可以拥有独立的界面语言、主题、布局和快捷键。
- 未来 `touchfish setting` 只处理真正跨模块的全局设置。
- Read v0.4 的界面和操作默认参考 Word v0.2；只有小说特有交互才单独设计。
- 较大功能先讨论交互，再实现。

## Next Steps / 下一步

1. 与用户讨论并记录 v0.4 剩余功能及交互方案。
2. 继续在 `feature/read-settings` 上小步实现并进行实际界面检查。
3. 用户明确确认 v0.4 功能完成后，再做完整人工验收、分支整合和发布准备。
4. v0.4 完成前不提前进入 v0.5 全局 `touchfish setting`。

## Development Rules / 开发规则

- 小步修改，一次完成一个明确目标。
- 不提前实现未经确认的后续版本功能。
- 不重写架构，保留现有用户数据兼容性。
- 修改后运行类型检查和相应测试；稳定后及时提交。
- 本地提交可由助手执行；推送、合并和发布必须由用户明确提出。

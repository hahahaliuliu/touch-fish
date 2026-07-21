# Touch Fish

Touch Fish 是一个 Terminal Learning Tool。

它不是普通背单词软件，而是一个适合开发间隙使用的低调终端学习工具。

核心理念：

> Learn in the gaps. Stay in the terminal.

简单说：

> 在等待构建、工具响应或上下文切换的时候，顺手背几个单词。

## Current Stage / 当前阶段

当前项目处于：

```txt
v0.2 Product Experience
```

这个阶段的重点不是疯狂加功能，而是让 Word Workspace 稳定、好用，并且更自然地融入终端开发环境。

## Quick Start / 快速开始

你需要先安装：

- Node.js
- npm

下载项目：

```powershell
git clone <your-repo-url>
cd "Touch Fish"
```

安装依赖：

```powershell
npm install
```

启动 Word Session：

```powershell
npm run dev -- word
```

查看当前设置：

```powershell
npm run dev -- setting
```

Settings 当前支持：

- W/S 或 ↑/↓ 移动选择项
- Enter 进入编辑 / 确认
- A/D 或 ←/→ 修改当前值
- Esc 取消编辑
- Ctrl+O 返回 Word
- Q 退出

当前可修改：

- Group Vocabulary: on / off
- Page Size: 1 / 3 / 5 / custom
- Group Size: 10 / 20 / 30 / custom
- Navigation Loop: on / off
- Study Order: sequential / random
- Vocabulary Book: automatically discovered local JSON books
- Download Vocabulary: download public vocabulary books from the catalog
- Theme: build-log / backend-log
- Custom key bindings for Word navigation and display controls

`Page Size` 和 `Group Size` 进入编辑后，可以用左右键切换预设值和 `custom`。
选中 `custom` 时显示 `_`，直接输入任意正整数后按 Enter 保存。

如果想在任意目录使用 `touchfish word`，可以执行：

```powershell
npm link
touchfish word
```

`npm link` 只需要在项目目录里执行一次。之后就可以在其他目录运行：

```powershell
touchfish word
```

查看当前设置：

```powershell
touchfish setting
```

## First-Time Setup Notes / 第一次配置说明

仓库里提交了一份示例词库：

```txt
assets/vocabulary/ielts.example.json
```

程序在没有真实词书时会自动使用它。你自己的完整词书放进 `assets/vocabulary/` 后，重新启动即可被自动识别。

也可以在 Settings 中打开 `Download Vocabulary` 下载公开目录中的词书。目录与内容规则见：

```txt
docs/vocabulary-downloads.md
```

## Run / 运行方式

开发时使用：

```powershell
npm run dev -- word
```

本地链接 CLI 后使用：

```powershell
touchfish word
```

链接 CLI：

```powershell
cd "D:\Touch Fish"
npm link
```

## Current Features / 当前功能

- CLI 入口
- `touchfish word`
- Word Session
- 键盘交互
- Workspace：默认一页 3 个单词，支持自定义每页数量
- 可选学习分组：默认每组 20 个单词，支持自定义组大小
- 分组内循环与整本词书连续浏览
- 顺序与随机学习模式，分别保存各自的学习位置
- Display Mode：英文、中文、英文 + 中文
- JSON 词库
- 在线词库目录和下载校验
- 本地学习进度保存
- Build Log 风格界面
- `?` Help 视图，显示快捷键和当前 Workspace 状态

## Keyboard / 快捷键

| 按键 | 作用 |
| --- | --- |
| `A` / `←` | 当前范围内上一页 |
| `D` / `→` | 当前范围内下一页 |
| `[` / `↑` | 上一学习组 |
| `]` / `↓` | 下一学习组 |
| `Space` | 重复上一次导航 |
| `Tab` | 切换显示模式 |
| `Ctrl+O` | 打开 Settings；在 Settings 中返回 Word |
| `?` | 打开 / 关闭 Help 视图 |
| `Q` | 退出 |

## Vocabulary / 词库

本地词库文件：

```txt
assets/vocabulary/ielts-luran.json
```

这个文件会被 Git 忽略。

示例词库文件：

```txt
assets/vocabulary/ielts.example.json
```

词库格式说明见：

```txt
docs/vocabulary-format.md
```

## Project Structure / 项目结构

```txt
src/
  commands/   CLI 命令入口
  session/    Session 生命周期
  services/   业务逻辑
  storage/    本地存储
  models/     数据模型
  config/     默认配置和路径
  ui/         终端渲染和主题

assets/
  vocabulary/ 词库
  progress/   本地进度

docs/         项目说明和未来计划
```

## Not Doing Now / 当前不做

- Electron
- 登录
- 云同步
- AI 功能
- 数据库
- Read Mode

这些功能属于后续阶段。

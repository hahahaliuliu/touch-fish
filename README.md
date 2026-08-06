# Touch Fish

<p align="center">
  <strong>Learn in the gaps. Stay in the terminal.</strong><br>
  A stealth terminal vocabulary learning tool disguised as development logs.
</p>

<p align="center">
  <a href="https://github.com/hahahaliuliu/touch-fish/actions/workflows/ci.yml"><img alt="Node.js CI" src="https://github.com/hahahaliuliu/touch-fish/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Version v0.2.0" src="https://img.shields.io/badge/version-v0.2.0-3b82f6">
  <img alt="Node.js 22.12 or newer" src="https://img.shields.io/badge/node-%3E%3D22.12-43853d">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-8b5cf6"></a>
</p>

![Touch Fish terminal preview](docs/images/touch-fish-preview.svg)

Touch Fish 是一个适合开发间隙使用的终端学习工具。

它把背单词内容呈现成开发日志、构建输出等终端内容，让用户在等待构建、工具响应或上下文切换时，顺手学习几个单词。

> Learn in the gaps. Stay in the terminal.

当前项目处于 `v0.2 Product Experience` 阶段，重点是让 Word Workspace 稳定、好用，并自然地融入终端开发环境。

## 安装与启动

### 1. 环境准备

先检查当前环境中是否已经安装 Node.js 和 npm：

```shell
node --version
npm --version
```

Touch Fish 当前需要：

- Node.js `>= 22.12.0`
- npm 可以正常运行

推荐使用 Node.js 24 LTS。如果两个命令都能显示版本，并且 Node.js 版本符合要求，可以直接跳到“获取项目”。

如果命令不存在或 Node.js 版本太低，请根据自己的系统安装或升级 Node.js。

#### Windows 安装

可以从 [Node.js 官网](https://nodejs.org/)下载安装 Node.js 24 LTS，也可以使用 Windows Package Manager：

```powershell
winget install OpenJS.NodeJS.LTS
```

#### Ubuntu / WSL 安装

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc
nvm install 24
nvm alias default 24
```

安装或升级完成后，请重新检查版本：

```shell
node --version
npm --version
```

两个命令都能正常显示版本，才表示运行环境准备完成。

### 2. 获取项目

可以任选一种方式。

使用 Git：

```shell
git clone https://github.com/hahahaliuliu/touch-fish.git
cd touch-fish
```

不使用 Git：

1. 在 GitHub 项目页面点击 `Code`。
2. 点击 `Download ZIP`。
3. 解压文件。
4. 在解压后的项目文件夹中打开终端。

后续命令都必须在包含 `package.json` 的项目根目录执行。

### 3. 安装项目依赖

进入克隆或解压后的 Touch Fish 项目根目录，也就是包含 `package.json` 的目录，然后执行：

```shell
npm install
```

依赖会安装到项目自己的 `node_modules/` 目录。

### 4. 启动 Word Session

在项目根目录中，使用开发方式启动：

```shell
npm run dev -- word
```

看到开发日志风格的单词界面，就表示安装和启动成功。

### 5. 在任意目录使用 `touchfish`

在项目根目录执行一次：

```shell
npm link
```

之后可以在当前系统的任意目录启动：

```shell
touchfish word
```

浏览收藏单词：

```shell
touchfish favorite
```

也可以在 Settings 中选择 `View Favorites` / `查看收藏`。

打开独立 Settings：

```shell
touchfish setting
```

`npm link` 通常只需执行一次。请不要移动或删除项目目录；如果通过 nvm 更换了 Node.js 版本，可能需要重新执行 `npm link`。

## 第一次使用

仓库自带一份 30 词示例词书：

```text
assets/vocabulary/ielts.example.json
```

没有安装其他词书时，Touch Fish 会自动使用它，因此第一次启动不需要手动准备词书。

在 Word Session 中按 `Ctrl+O` 可以打开 Settings。Settings 支持：

- 调整每页单词数量和学习组大小
- 切换顺序、倒序或随机学习
- 切换终端伪装主题
- 控制备注的隐藏、显示和编辑
- 自定义快捷键
- 下载、切换或卸载词书
- 导入 JSON、TXT、CSV 或带可复制文本的 PDF 词书

词书下载说明见 [docs/vocabulary-downloads.md](docs/vocabulary-downloads.md)，自定义词书格式见 [docs/vocabulary-format.md](docs/vocabulary-format.md)。

## 常用快捷键

| 按键 | 作用 |
| --- | --- |
| `A` / `←` | 当前范围内上一页 |
| `D` / `→` | 当前范围内下一页 |
| `[` / `↑` | 上一学习组 |
| `]` / `↓` | 下一学习组 |
| `Space` | 重复上一次导航 |
| `Tab` | 切换单词显示模式 |
| `T` | 开始当前学习组测试 |
| `E` | 在“备注：可编辑”时选择并编辑本页单词备注 |
| `F` | 在选择模式中收藏或取消收藏 |
| `Ctrl+O` | 打开 Settings；在 Settings 中返回 Word |
| `?` | 打开或关闭 Help |
| `Esc` | 从 Help 返回；在 Settings 中取消编辑或返回 Word |
| `Q` | 保存进度并退出 |

选择模式中，`E` 进入、`Esc` 退出；上下键移动光标，`F` 收藏或取消收藏，`Enter` 在备注可编辑时进入备注编辑。

快捷键可以在 Settings 中修改。

## 当前功能

- CLI 入口：`touchfish word`、`touchfish favorite`、`touchfish setting`
- 终端 Word Session 和键盘交互
- 自定义每页单词数量
- 可选学习分组和自定义组大小
- 分组内循环与整本词书连续浏览
- 顺序、倒序和随机学习模式，并分别保存进度
- 英文、中文、英文 + 中文显示模式
- 当前学习组测试，支持双向测试
- 测试结果页显示用户答案、标准答案，并支持重新测试错题
- Build Log、Backend Log 和 Git 终端主题
- Settings、Help 和词书管理界面的中英文切换
- 单词备注的隐藏、显示和本地编辑
- 本地学习进度和用户设置保存
- 词书自动发现、下载、卸载和本地导入

## 开发与测试

运行自动测试：

```shell
npm test
```

当前自动测试共 39 项，覆盖核心逻辑、渲染、进度存储、收藏和 CLI Session 交互。

不使用全局链接时打开 Settings：

```shell
npm run dev -- setting
```

项目主要结构：

```text
src/
  commands/   CLI 命令入口
  session/    Session 生命周期
  services/   业务逻辑
  storage/    本地存储
  models/     数据模型
  config/     默认配置和路径
  ui/         终端渲染和主题

assets/
  vocabulary/ 词书
  progress/   本地进度

docs/         格式说明和开发计划
```

## 当前不做

- Electron
- 登录
- 云同步
- AI 功能
- 数据库
- Read Mode

这些功能不属于当前阶段目标。

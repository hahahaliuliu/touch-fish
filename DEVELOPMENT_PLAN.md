# Touch Fish 开发计划

Touch Fish 是一个伪装成开发输出的终端学习工具。

当前包含两个模块：

- Word：背单词。
- Read：阅读小说。

## 命令结构

```text
touchfish
touchfish word
touchfish word -s
touchfish word -f
touchfish read
touchfish read -s
touchfish read -m
```

- `touchfish`：显示核心命令和简要帮助。
- `touchfish word`：开始背单词。
- `touchfish word -s / --settings`：Word 专属设置。
- `touchfish word -f / --favorite`：查看收藏词汇。
- `touchfish read`：继续阅读上一次阅读的小说。
- `touchfish read -s / --settings`：Read 专属设置。
- `touchfish read -m / --mini`：启动小窗口阅读模式。

## 开发计划

### v0.1 — 项目基础（已完成开发）

#### 版本计划

- 项目目录结构和代码职责划分。
- `touchfish word` 启动命令。
- Word 终端伪装界面。
- 基础操作按键和退出方式。
- Help 界面。

#### 开发记录

- 版本计划全部完成。

### v0.2 — Word Settings（已完成开发）

#### 版本计划

##### Word 核心体验

- 单词分页、学习分组和分组循环。
- 顺序、倒序、随机与重新随机学习。
- 本地词书读取，包括示例词书和导入词书。
- 多词书切换和每本词书独立进度。
- 中英文界面和多种单词显示方式。
- Build Log、Backend Log 和 Git 伪装主题。
- 备注、组内单词测试和单词收藏。
- Help 页面和 Settings 页面。

##### Word Settings 与词书管理

- 页面数量、学习组大小和分组开关。
- 翻页循环、学习顺序和当前词书。
- 界面语言、备注模式和伪装主题。
- 查看收藏、词书下载、导入和卸载。
- 自定义操作按键。

#### 开发记录

- 版本计划基本完成。
- 建立自动测试、Session 集成测试和 Node.js CI。
- 发布 v0.2.0。

- 音标、例句和标签等词书附加内容的显示暂缓。

### v0.3 — Read Core（已完成开发）

#### 版本计划

- 命令结构调整，核心模块统一为 Word 和 Read。
- Word Settings 和收藏调整为 `touchfish word -s`、`touchfish word -f`。
- `touchfish read` 启动命令。
- 本地 UTF-8 TXT 小说阅读。
- 小说分页和中英文宽度适配。
- 小说章节识别。
- 当前小说和每本小说独立阅读进度。
- 上下页、上下章和重复上次操作。
- Help 界面。

#### 开发记录

- 版本计划全部完成。
- 建立 Read Session、阅读进度和章节导航的集成测试。

### v0.4 — Read Settings（已完成开发）

#### 版本计划

##### Read Settings

- `touchfish read -s` 启动命令。
- Read Settings 界面。
- 当前小说、正文宽度和每页行数。
- 章节切分和小节导航。
- 界面语言。
- Build Log、Backend Log 和 Git 伪装主题。
- 自定义操作按键。

##### 小说管理

- 本地 UTF-8 TXT 小说导入。
- 多本小说管理。
- 每本小说独立阅读进度。

##### 其他阅读方式

- 小窗口阅读模式使用独立终端窗口显示正文。
- 原窗口保留当前伪装主题，并可进入 Help 和 Read Settings。
- 小窗口关闭后原程序继续运行，关闭小窗口模式后恢复原有伪装阅读界面。
- 小窗口设置，包括窗口尺寸和字体大小调整。
- 支持鼠标拖动边框调整小窗口尺寸，并保存为下次启动尺寸。
- 小窗口支持鼠标滚轮左右翻页和上下逐行滚动，并可在 Read Settings 中选择。
- 设置小窗口上下滚动的速率。
- 使用按键绑定中的鼠标右键快速打开、取消打开或关闭小窗口。

#### 开发记录

- 版本计划基本完成。
- 增加阅读进度、设置和小说数据保护。
- 在现有自动测试和 Node.js CI 基础上，扩充 Read 与小窗口相关测试。
- 完成 npm 安装包和 Windows Terminal 小窗口实际运行验证。

- 小窗口自定义隐蔽页和 Word 小窗口模式暂缓。
- 书签、搜索、段落收藏和更多小说格式暂缓。

### v0.5 — 全局设置与更多应用（计划中）

#### 版本计划

- `touchfish setting` 全局设置。
- 更多场景应用，如“科目一与科目四”“考公行测”“歌词”。

#### 开发记录

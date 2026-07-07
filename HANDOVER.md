# Touch Fish Handover

## Project Goal

Touch Fish 是一个伪装成开发工具的学习软件。

不是隐藏学习。

而是让学习看起来像工作。

---

## Current Version

v0.2-dev

---

## Core Concepts

Workspace

不是一页一个单词。

而是一组单词。

默认：

3 个。

以后支持：

1 / 3 / 5。

---

Theme

UI 不直接写死。

以后支持：

CLI Log

C++

TypeScript

Python

VS Code

Cursor

JetBrains

---

Renderer

Renderer 不负责决定长什么样。

Theme 决定。

Renderer 负责调用。

---

Help

默认隐藏。

只有：

?

显示：

Progress

Vocabulary

Mode

Shortcut

---

Development Principles

- 小步提交
- 每完成一个功能 Commit
- 不过早抽象
- 一个文件一个职责
- 已完成设计不要轻易推翻
- 优先讨论产品，再写代码

---

Current Architecture

commands/

session/

services/

storage/

models/

config/

ui/

assets/

---

Completed

......

---

Next Milestone

Workspace UI

↓

Settings

↓

Theme System

↓

Read Mode
# Touch Fish Design
Touch Fish doesn't hide your study. It disguises it as work.
> Version: v0.1

---

# 1. Design Philosophy

Touch Fish 的目标不是成为一个传统的背单词软件。

它应该成为开发工作流中的一部分，在尽可能不打断工作的情况下帮助用户学习。

## Core Principles

### Stealth First

所有设计优先考虑隐蔽性。

不要让别人一眼看出来这是学习软件。

---

### Keyboard Only

所有操作均可通过键盘完成。

不依赖鼠标。

---

### Don't Interrupt Workflow

Touch Fish 不应该打断开发。

进入学习后，退出应恢复原来的终端状态，用户可以继续编码。

---

### State Persistence

Touch Fish 应该记住用户的状态。

例如：

* 当前单词
* Display Mode
* Window Mode（未来）
* Theme（未来）

再次打开时自动恢复。

---

### One Command, One Session

一个命令进入一个 Session。

例如：

```
touchfish word
```

进入 Word Session。

以后：

```
touchfish read
```

进入 Read Session。

---

# 2. Display Mode

Word Session 只有一个 Session。

学习方式由 Display Mode 决定。

按 **Tab** 循环切换。

## Mode 1

English + Chinese

```
abandon

放弃；遗弃
```

---

## Mode 2

English Only

```
abandon
```

---

## Mode 3

Chinese Only

```
放弃；遗弃
```

---

未来可以继续增加：

* Example Mode
* Mask Mode
* Review Mode

Display Mode 使用 Tab 循环切换。

---

# 3. Word Session

默认流程：

```
Terminal

↓

touchfish word

↓

Word Session

↓

Q

↓

恢复 Terminal
```

退出后尽可能恢复进入前的终端状态。

---

# 4. Keyboard Interaction

## Default Shortcuts

| Key   | Function               |
| ----- | ---------------------- |
| Space | Repeat Last Navigation |
| A     | Previous Word          |
| D     | Next Word              |
| Tab   | Switch Display Mode    |
| ?     | Show Help              |
| Q     | Quit Session           |

---

## Navigation

按下：

```
A
```

进入 Previous 状态。

之后：

```
Space
```

持续执行 Previous。

---

按下：

```
D
```

进入 Next 状态。

之后：

```
Space
```

持续执行 Next。

Space 永远重复最近一次导航动作。

---

## Help

默认隐藏。

按：

```
?
```

覆盖显示帮助界面。

按任意键关闭帮助。

---

# 5. UI Design

Word Session 不应该有明显的边框。

单词区域应该自然融入终端。

上下都应保留足够内容用于伪装。

目标不是漂亮。

而是自然。

后续将继续探索：

* Terminal 风格
* VS Code 风格
* Claude Code 风格

---

# 6. Future Design

未来计划支持：

## Word

* Example
* Favorite
* Wrong Words
* Review
* Statistics

---

## Read

小说阅读模式。

---

## Setting

支持配置：

* Display Mode
* Window Mode
* Theme
* Navigation Key
* Font Size

---

## Window Mode

未来支持两种模式：

### Immersive Mode

类似 Vim。

临时占用整个终端。

退出恢复终端。

---

### Embedded Mode

直接在已有终端内容下学习。

更加隐蔽。

用户可在 Setting 中切换。

---

# 7. Design Goal

Touch Fish 不是一个为了展示的项目。

它应该成为一个真正可以每天使用的工具。

所有设计都围绕一个目标：

> Learn without interrupting your workflow.



# Vocabulary Downloads / 在线词库下载

Touch Fish 可以从公开词库目录下载词书到本地。

在 Settings 中选择 `Download Vocabulary`，进入下载列表后：

- `W` / `S` 或上下方向键选择词书
- `Enter` 下载选中的词书
- `Esc` 返回 Settings
- `Q` 退出程序

下载完成后，词书会保存到：

```txt
assets/vocabulary/<book-id>.json
```

安装后的词书会自动出现在 Settings 的 `Vocabulary Book` 中。下载服务会在写入文件前校验 JSON 结构和词书 id；下载中断或格式不正确时，不会留下半个词书文件。

## Manage Installed Books / 管理已安装词书

下载列表顶部会显示 `Installed`。这里包含公开目录下载的词书、内置示例词书，以及用户自己放进 `assets/vocabulary/` 的 JSON 词书。

- 选中已安装词书后按 `Enter`，会打开卸载确认。
- 按 `Y` 才会执行卸载；按 `Esc` 取消。
- 卸载会删除该词书 JSON 文件，以及该词书保存的顺序进度、随机进度和随机顺序。
- 重新下载同一本词书会从全新进度开始。

手动导入的词书也可以卸载，因此确认提示会明确说明本地词书文件会被删除。若卸载了最后一本词书，Touch Fish 会保留在 Settings；这时可以继续打开下载列表，或把新的词书导入项目。

## Import Vocabulary File / 导入词书文件

下载列表最后一项是 `Import Vocabulary File`。选中它后按 `Enter`，粘贴词书 JSON、TXT 或 CSV 的完整文件路径，再按一次 `Enter` 导入。

- Windows Terminal 或 PowerShell 中可以直接把 JSON、TXT 或 CSV 文件拖进终端，自动填入路径。
- 路径两侧的英文双引号会被自动忽略。
- `Esc` 取消输入；`Backspace` 删除一个字符。
- 导入时会按 Touch Fish 的词库格式校验，并复制一份到 `assets/vocabulary/`；原文件不会被修改。

## Public Catalog / 公开目录

默认目录地址：

```txt
https://raw.githubusercontent.com/hahahaliuliu/touch-fish/main/assets/catalog.json
```

如果远程目录暂时无法访问，Touch Fish 会回退到项目自带的 `assets/catalog.json`，这样仍可以看到内置示例词书；实际下载词书时仍需要网络连接。

目录中的每一项必须包含：

- `id`
- `name`
- `description`
- `wordCount`
- `version`
- `license`
- `sourceUrl`
- `downloadUrl`

下载地址和来源地址必须使用 HTTPS。词书 `id` 必须只包含小写字母、数字和连字符。

目录项使用两种状态：

- `available`：可以按 Enter 下载，必须提供完整下载信息
- `coming-soon`：用于提前展示计划中的词书，按 Enter 只会提示尚未开放下载

## Included Downloadable Books / 当前可下载词书

除内置的 30 词示例书外，目录现在还提供以下 ECDICT 生成词书：

- `High School Vocabulary`：3,674 个带 `gk` 标签的词条。
- `High School High Frequency`：按 ECDICT `frq` 字段排序的前 1,500 个 `gk` 词条。
- `CET-4 High Frequency`：按 `frq` 排序的前 1,500 个 `cet4` 词条。
- `CET-6 High Frequency`：按 `frq` 排序的前 1,500 个 `cet6` 词条。
- `IELTS High Frequency`：按 `frq` 排序的前 1,500 个 `ielts` 词条。

这里的“高频”是从 ECDICT 的语料频率字段中筛选出的结果，不是任何考试机构发布的官方词表。下载文件存放在仓库的 `assets/downloads/`，而用户下载后的副本仍写入本地的 `assets/vocabulary/`。

## Content Policy / 内容规则

- 只把可以公开再分发的词书放进目录
- 每本书必须写清来源和许可证
- 用户私人的词书，例如路然雅思词书，不应加入公开目录
- ECDICT 生成的公开下载词书遵守其 MIT 许可证，许可证副本位于 `assets/downloads/LICENSE-ECDICT.txt`

以后新增其他词书时，应先确认来源允许再分发，再把词书放到 GitHub Release、`assets/downloads/` 或其他稳定 HTTPS 地址，最后在 `assets/catalog.json` 中新增对应条目。

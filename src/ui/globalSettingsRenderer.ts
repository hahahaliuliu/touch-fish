export function getGlobalSettingsScreen(): string {
  return [
    "[INFO] 全局设置入口已打开",
    "",
    "Touch Fish 全局设置",
    "",
    "当前版本暂无可配置的全局设置项。",
    "Word 和 Read 的设置相互独立，请使用以下命令打开：",
    "Word 设置：touchfish word -s",
    "Read 设置：touchfish read -s",
    "",
    "操作  Q / Ctrl+C 退出程序",
  ].join("\n");
}

export function renderGlobalSettings() {
  console.clear();
  console.log(getGlobalSettingsScreen());
}

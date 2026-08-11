import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import type { ReadMiniWindowState } from "../services/readMiniWindow.js";

export function renderReadMiniHost(
  theme: ThemeName,
  language: InterfaceLanguage,
  helpBindings: [string, string],
  miniWindowBindings: [string, string],
  showHelp: boolean,
  state: ReadMiniWindowState
) {
  console.clear();
  if (showHelp) {
    renderHelp(language, helpBindings, miniWindowBindings, state);
    return;
  }

  if (theme === "backend-log") {
    renderBackendLog();
  } else if (theme === "git") {
    renderGit();
  } else {
    renderBuildLog();
  }

  if (state.status === "error") {
    console.log("");
    console.log(`[WARN] ${state.message ?? "small window failed to open"}`);
  }
}

function renderBuildLog() {
  console.log("[INFO] compiling workspace...");
  console.log("[INFO] resolving dependency graph...");
  console.log("[INFO] loading cached transform results...");
  console.log("[INFO] modules transformed: 42");
  console.log("[INFO] generating optimized chunks...");
  console.log("");
  console.log("assets by status  cached modules");
  console.log("  runtime modules 698 bytes 4 modules");
  console.log("  modules by path ./src/cache/ 1.24 KiB");
  console.log("  modules by path ./node_modules/ 8.15 KiB");
  console.log("");
  console.log("[INFO] build completed successfully in 42ms");
  console.log("[INFO] watching for file changes...");
  console.log("runtime: idle");
  console.log(">");
}

function renderBackendLog() {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} INFO  cache-worker booting service=workspace-index`);
  console.log(`${timestamp} INFO  config loaded source=local-store`);
  console.log(`${timestamp} DEBUG cache pool connected name=workspace-cache`);
  console.log(`${timestamp} INFO  cache-worker sync complete status=ready`);
  console.log(`${timestamp} INFO  http server listening addr=127.0.0.1:4310`);
  console.log("service: ready");
  console.log(">");
}

function renderGit() {
  console.log("On branch feature/workspace-index");
  console.log("Your branch is up to date with 'origin/feature/workspace-index'.");
  console.log("");
  console.log("nothing to commit, working tree clean");
  console.log("workspace@local:~$");
}

function renderHelp(
  language: InterfaceLanguage,
  helpBindings: [string, string],
  miniWindowBindings: [string, string],
  state: ReadMiniWindowState
) {
  const chinese = language === "chinese";
  console.log(chinese ? "Touch Fish 小窗口模式帮助" : "Touch Fish Mini Mode Help");
  console.log("");
  console.log(`  Ctrl+O             ${chinese ? "打开阅读设置" : "open Read settings"}`);
  const miniWindowKeys = miniWindowBindings.filter(Boolean).map(formatBinding).join(" / ") || "-";
  console.log(`  ${miniWindowKeys.padEnd(19, " ")}${chinese ? "打开或关闭小窗口" : "open or close mini window"}`);
  const helpKeys = helpBindings.filter(Boolean).map(formatBinding).join(" / ") || "-";
  console.log(`  ${helpKeys.padEnd(19, " ")}${chinese ? "关闭帮助" : "close help"}`);
  console.log(`  Esc                ${chinese ? "返回伪装界面" : "return to disguise"}`);
  console.log(`  Q / Ctrl+C         ${chinese ? "退出整个程序" : "quit the whole program"}`);
  console.log("");
  const status = state.status === "open"
    ? chinese ? "已打开" : "open"
    : state.status === "opening"
      ? chinese ? "正在打开" : "opening"
      : state.status === "error"
        ? chinese ? "打开失败" : "failed"
        : chinese ? "已关闭" : "closed";
  console.log(`  ${chinese ? "小窗口状态" : "mini window"}       ${status}`);
}

function formatBinding(binding: string) {
  return {
    "arrow-up": "Up Arrow",
    "arrow-down": "Down Arrow",
    "arrow-left": "Left Arrow",
    "arrow-right": "Right Arrow",
    space: "Space",
    "mouse-middle": "Middle Mouse",
    "mouse-right": "Right Mouse",
  }[binding] ?? binding.toUpperCase();
}

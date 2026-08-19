import { Command, Option } from "commander";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const packageMetadata = require("../package.json") as { version: string };

export interface TouchFishCommandHandlers {
  startWord: () => void | Promise<void>;
  startWordSettings: () => void | Promise<void>;
  startWordFavorites: () => void | Promise<void>;
  startRead: () => void | Promise<void>;
  startReadSettings: () => void | Promise<void>;
  startReadMini: () => void | Promise<void>;
  startReadMiniChild: (options: ReadMiniChildCommandOptions) => void | Promise<void>;
}

export interface ReadMiniChildCommandOptions {
  port: number;
  token: string;
  bookId: string;
}

export function createTouchFishProgram(handlers: TouchFishCommandHandlers) {
  const program = new Command();

  program
    .name("touchfish")
    .description("适合开发间隙使用的终端学习工具。")
    .version(packageMetadata.version, "-V, --version", "显示当前版本")
    .helpOption("-h, --help", "显示命令帮助")
    .helpCommand("help [command]", "显示指定命令的帮助")
    .showHelpAfterError();

  program
    .command("word")
    .description("开始背单词")
    .addOption(
      new Option("-s, --settings", "打开 Word 设置").conflicts("favorite")
    )
    .addOption(
      new Option("-f, --favorite", "查看收藏词汇").conflicts("settings")
    )
    .action(async (options: { settings?: boolean; favorite?: boolean }) => {
      if (options.settings) {
        await handlers.startWordSettings();
        return;
      }

      if (options.favorite) {
        await handlers.startWordFavorites();
        return;
      }

      await handlers.startWord();
    });

  program
    .command("read")
    .description("继续阅读小说")
    .addOption(
      new Option("-s, --settings", "打开 Read 设置").conflicts("mini")
    )
    .addOption(
      new Option("-m, --mini", "打开 Read 小窗口").conflicts("settings")
    )
    .addOption(new Option("--mini-child", "Internal small-window reader").hideHelp())
    .addOption(new Option("--mini-port <port>", "Internal host port").hideHelp().argParser(Number))
    .addOption(new Option("--mini-token <token>", "Internal host token").hideHelp())
    .addOption(new Option("--mini-book <bookId>", "Internal novel id").hideHelp())
    .action(async (options: {
      settings?: boolean;
      mini?: boolean;
      miniChild?: boolean;
      miniPort?: number;
      miniToken?: string;
      miniBook?: string;
    }) => {
      if (options.miniChild) {
        if (!Number.isInteger(options.miniPort) || !options.miniToken || !options.miniBook) {
          throw new Error("Invalid internal Read mini-window arguments");
        }
        await handlers.startReadMiniChild({
          port: options.miniPort!,
          token: options.miniToken,
          bookId: options.miniBook,
        });
        return;
      }

      if (options.settings) {
        await handlers.startReadSettings();
        return;
      }

      if (options.mini) {
        await handlers.startReadMini();
        return;
      }

      await handlers.startRead();
    });

  return program;
}

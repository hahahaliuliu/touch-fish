import { Command, Option } from "commander";

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
    .description("A stealth terminal learning tool.")
    .version("0.2.0")
    .showHelpAfterError();

  program
    .command("word")
    .description("Learn words in a disguised terminal workspace")
    .addOption(
      new Option("-s, --settings", "Open Word settings").conflicts("favorite")
    )
    .addOption(
      new Option("-f, --favorite", "Browse favorite words").conflicts("settings")
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
    .description("Read novels in a disguised terminal workspace")
    .addOption(
      new Option("-s, --settings", "Open Read settings").conflicts("mini")
    )
    .addOption(
      new Option("-m, --mini", "Open Read in a small independent window").conflicts("settings")
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

  // Keep the v0.2 commands working during the v0.3 transition, but do not
  // advertise them as top-level commands. They can be removed in v0.4.
  program
    .command("setting", { hidden: true })
    .action(() => handlers.startWordSettings());

  program
    .command("favorite", { hidden: true })
    .action(() => handlers.startWordFavorites());

  return program;
}

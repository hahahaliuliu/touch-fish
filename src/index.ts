import { Command } from "commander";
import { startSettingCommand } from "./commands/setting.js";
import { startWordCommand } from "./commands/word.js";
import { startFavoriteCommand } from "./commands/favorite.js";

const program = new Command();

program
  .name("touchfish")
  .description("A stealth terminal learning tool.")
  .version("0.2.0");

program
  .command("word")
  .description("Start word learning session")
  .action(() => startWordCommand());

program
  .command("setting")
  .description("Show current local settings")
  .action(() => {
    startSettingCommand();
  });

program
  .command("favorite")
  .description("Browse favorite words")
  .action(() => startFavoriteCommand());

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}

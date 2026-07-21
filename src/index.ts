import { Command } from "commander";
import { startSettingCommand } from "./commands/setting.js";
import { startWordCommand } from "./commands/word.js";

const program = new Command();

program
  .name("touchfish")
  .description("A stealth terminal learning tool.")
  .version("0.1.0");

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

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}

import { startSettingCommand } from "./commands/setting.js";
import { startWordCommand } from "./commands/word.js";
import { startFavoriteCommand } from "./commands/favorite.js";
import {
  startReadCommand,
  startReadSettingsCommand,
} from "./commands/read.js";
import { createTouchFishProgram } from "./cli.js";

const program = createTouchFishProgram({
  startWord: startWordCommand,
  startWordSettings: startSettingCommand,
  startWordFavorites: startFavoriteCommand,
  startRead: startReadCommand,
  startReadSettings: startReadSettingsCommand,
});

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}

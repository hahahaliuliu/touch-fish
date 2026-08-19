import { startSettingCommand } from "./commands/setting.js";
import { startWordCommand } from "./commands/word.js";
import { startFavoriteCommand } from "./commands/favorite.js";
import {
  startReadCommand,
  startReadMiniChildCommand,
  startReadMiniCommand,
  startReadSettingsCommand,
} from "./commands/read.js";
import { createTouchFishProgram, getTouchFishOverview } from "./cli.js";

const program = createTouchFishProgram({
  startWord: startWordCommand,
  startWordSettings: startSettingCommand,
  startWordFavorites: startFavoriteCommand,
  startRead: startReadCommand,
  startReadSettings: startReadSettingsCommand,
  startReadMini: startReadMiniCommand,
  startReadMiniChild: startReadMiniChildCommand,
});

if (process.argv.length <= 2) {
  console.log(getTouchFishOverview());
} else {
  program.parse();
}

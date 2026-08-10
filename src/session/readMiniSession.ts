import type { ReadMiniChildCommandOptions } from "../cli.js";
import type { ReadingBook, ReadSettings } from "../models/reading.js";
import { connectToReadMiniHost } from "../services/readMiniWindow.js";
import { loadReadSettings, saveReadSettings } from "../storage/readSettings.js";
import { startReadSession } from "./readSession.js";

const RESIZE_SAVE_DELAY = 500;

export function startReadMiniChildSession(
  book: ReadingBook,
  options: ReadMiniChildCommandOptions
) {
  let closing = false;
  let resizeTimer: NodeJS.Timeout | undefined;
  let control: ReturnType<typeof startReadSession> | undefined;
  const saveWindowSize = () => {
    persistReadMiniWindowSize(process.stdout.columns, process.stdout.rows);
  };
  const scheduleWindowSizeSave = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(saveWindowSize, RESIZE_SAVE_DELAY);
  };
  const handleWindowResize = () => {
    control?.resize();
    scheduleWindowSizeSave();
  };
  const close = () => {
    if (closing) {
      return;
    }
    closing = true;
    control?.close();
  };
  process.stdout.on("resize", handleWindowResize);
  scheduleWindowSizeSave();
  const socket = connectToReadMiniHost(options.port, options.token, close);
  control = startReadSession(book, {
    mode: "mini",
    onQuit: () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      process.stdout.off("resize", handleWindowResize);
      saveWindowSize();
      socket.destroy();
    },
  });
}

export function persistReadMiniWindowSize(
  columns: number | undefined,
  rows: number | undefined,
  loadSettings: () => ReadSettings = loadReadSettings,
  saveSettings: (settings: ReadSettings) => void = saveReadSettings
) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows)
    || columns === undefined || rows === undefined
    || columns < 20 || columns > 500 || rows < 5 || rows > 200) {
    return false;
  }

  const settings = loadSettings();
  if (settings.miniWindowColumns === columns && settings.miniWindowRows === rows) {
    return false;
  }
  saveSettings({
    ...settings,
    miniWindowColumns: columns,
    miniWindowRows: rows,
  });
  return true;
}

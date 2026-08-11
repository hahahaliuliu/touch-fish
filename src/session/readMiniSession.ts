import type { ReadMiniChildCommandOptions } from "../cli.js";
import type { ReadingBook, ReadSettings } from "../models/reading.js";
import { connectToReadMiniHost } from "../services/readMiniWindow.js";
import { loadReadSettings, saveReadSettings } from "../storage/readSettings.js";
import { startReadSession } from "./readSession.js";

const RESIZE_SAVE_DELAY = 500;
const RESIZE_SAVE_ACTIVATION_DELAY = 1000;

export function startReadMiniChildSession(
  book: ReadingBook,
  options: ReadMiniChildCommandOptions
) {
  let closing = false;
  let control: ReturnType<typeof startReadSession> | undefined;
  const launchSettings = loadReadSettings();
  let launchActualColumns: number | undefined;
  let launchActualRows: number | undefined;
  const saveWindowSize = () => {
    const launchSize = convertReadMiniWindowSizeToLaunchSize(
      process.stdout.columns,
      process.stdout.rows,
      launchSettings.miniWindowColumns,
      launchSettings.miniWindowRows,
      launchActualColumns,
      launchActualRows
    );
    persistReadMiniWindowSize(launchSize.columns, launchSize.rows);
  };
  const sizeSaver = createReadMiniWindowSizeSaver(saveWindowSize);
  const resizeActivationTimer = setTimeout(
    () => {
      launchActualColumns = process.stdout.columns;
      launchActualRows = process.stdout.rows;
      sizeSaver.activate();
    },
    RESIZE_SAVE_ACTIVATION_DELAY
  );
  const handleWindowResize = () => {
    control?.resize();
    sizeSaver.schedule();
  };
  const close = () => {
    if (closing) {
      return;
    }
    closing = true;
    control?.close();
  };
  process.stdout.on("resize", handleWindowResize);
  const socket = connectToReadMiniHost(options.port, options.token, close);
  control = startReadSession(book, {
    mode: "mini",
    onQuit: () => {
      clearTimeout(resizeActivationTimer);
      process.stdout.off("resize", handleWindowResize);
      sizeSaver.flush();
      socket.destroy();
    },
  });
}

export function convertReadMiniWindowSizeToLaunchSize(
  actualColumns: number | undefined,
  actualRows: number | undefined,
  launchColumns: number,
  launchRows: number,
  launchActualColumns: number | undefined,
  launchActualRows: number | undefined
) {
  return {
    columns: convertTerminalDimension(actualColumns, launchColumns, launchActualColumns),
    rows: convertTerminalDimension(actualRows, launchRows, launchActualRows),
  };
}

function convertTerminalDimension(
  actual: number | undefined,
  launch: number,
  launchActual: number | undefined
) {
  if (!Number.isInteger(actual) || actual === undefined
    || !Number.isInteger(launchActual) || launchActual === undefined
    || launchActual <= 0) {
    return actual;
  }
  return Math.round(actual * launch / launchActual);
}

export function createReadMiniWindowSizeSaver(
  save: () => void,
  delay = RESIZE_SAVE_DELAY
) {
  let timer: NodeJS.Timeout | undefined;
  let active = false;

  return {
    activate() {
      active = true;
    },
    schedule() {
      if (!active) {
        return;
      }
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = undefined;
        save();
      }, delay);
    },
    flush() {
      if (!timer) {
        return;
      }
      clearTimeout(timer);
      timer = undefined;
      save();
    },
  };
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

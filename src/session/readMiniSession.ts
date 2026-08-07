import type { ReadMiniChildCommandOptions } from "../cli.js";
import type { ReadingBook } from "../models/reading.js";
import { connectToReadMiniHost } from "../services/readMiniWindow.js";
import { startReadSession } from "./readSession.js";

export function startReadMiniChildSession(
  book: ReadingBook,
  options: ReadMiniChildCommandOptions
) {
  let closing = false;
  let control: ReturnType<typeof startReadSession> | undefined;
  const close = () => {
    if (closing) {
      return;
    }
    closing = true;
    control?.close();
  };
  const socket = connectToReadMiniHost(options.port, options.token, close);
  control = startReadSession(book, {
    mode: "mini",
    onQuit: () => socket.destroy(),
  });
}

import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import net, { type Socket } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MINI_PROFILE_NAME = "Touch Fish Mini";
const MINI_WINDOW_SIZE = "64,22";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const touchFishBin = path.join(projectRoot, "bin", "touchfish.js");

export type ReadMiniWindowStatus = "closed" | "opening" | "open" | "error";

export interface ReadMiniWindowState {
  status: ReadMiniWindowStatus;
  message?: string | undefined;
}

type StateListener = (state: ReadMiniWindowState) => void;

export class ReadMiniWindowController {
  private server: net.Server | undefined;
  private socket: Socket | undefined;
  private state: ReadMiniWindowState = { status: "closed" };
  private readonly listeners = new Set<StateListener>();
  private token = "";

  getState(): ReadMiniWindowState {
    return { ...this.state };
  }

  onStateChange(listener: StateListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async open(bookId: string) {
    if (this.state.status === "opening" || this.state.status === "open") {
      return;
    }

    if (process.platform !== "win32") {
      this.setState({ status: "error", message: "Small-window mode requires Windows Terminal" });
      return;
    }

    this.token = crypto.randomUUID();
    this.server = net.createServer((socket) => this.acceptConnection(socket));

    try {
      const port = await listenOnLocalhost(this.server);
      writeReadMiniTerminalProfile();
      this.setState({ status: "opening" });
      const child = launchReadMiniTerminal({ port, token: this.token, bookId });
      child.once("error", (error) => {
        this.closeServer();
        this.setState({ status: "error", message: error.message });
      });
    } catch (error) {
      this.closeServer();
      this.setState({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  closeMode() {
    if (this.socket && !this.socket.destroyed) {
      this.socket.end("close\n");
    }
    this.socket = undefined;
    this.closeServer();
    this.setState({ status: "closed" });
  }

  private acceptConnection(socket: Socket) {
    let buffer = "";
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex < 0) {
        return;
      }

      const suppliedToken = buffer.slice(0, newlineIndex);
      if (suppliedToken !== this.token || this.socket) {
        socket.destroy();
        return;
      }

      this.socket = socket;
      this.setState({ status: "open" });
    });
    socket.once("close", () => {
      if (this.socket === socket) {
        this.socket = undefined;
        this.setState({ status: "closed" });
      }
    });
    socket.once("error", () => {
      socket.destroy();
    });
  }

  private closeServer() {
    this.server?.close();
    this.server = undefined;
  }

  private setState(state: ReadMiniWindowState) {
    this.state = state;
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

export function connectToReadMiniHost(
  port: number,
  token: string,
  onCloseRequest: () => void
) {
  const socket = net.createConnection({ host: "127.0.0.1", port });
  let buffer = "";
  socket.setEncoding("utf8");
  socket.once("connect", () => socket.write(`${token}\n`));
  socket.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.includes("close\n")) {
      onCloseRequest();
    }
  });
  socket.once("close", onCloseRequest);
  socket.once("error", onCloseRequest);
  return socket;
}

export function getReadMiniTerminalFragmentPath(localAppData = process.env.LOCALAPPDATA) {
  if (!localAppData) {
    throw new Error("LOCALAPPDATA is unavailable");
  }
  return path.join(
    localAppData,
    "Microsoft",
    "Windows Terminal",
    "Fragments",
    "TouchFish",
    "read-mini.json"
  );
}

export function createReadMiniTerminalFragment() {
  return {
    profiles: [
      {
        name: MINI_PROFILE_NAME,
        commandline: "cmd.exe",
        fontSize: 8,
        padding: "4",
        closeOnExit: "always",
        historySize: 0,
        scrollbarState: "hidden",
        hidden: true,
      },
    ],
  };
}

export function writeReadMiniTerminalProfile(localAppData = process.env.LOCALAPPDATA) {
  const fragmentPath = getReadMiniTerminalFragmentPath(localAppData);
  const content = `${JSON.stringify(createReadMiniTerminalFragment(), null, 2)}\n`;
  fs.mkdirSync(path.dirname(fragmentPath), { recursive: true });

  if (!fs.existsSync(fragmentPath) || fs.readFileSync(fragmentPath, "utf8") !== content) {
    fs.writeFileSync(fragmentPath, content, "utf8");
  }

  return fragmentPath;
}

export function buildReadMiniTerminalArguments(options: {
  port: number;
  token: string;
  bookId: string;
}) {
  return [
    "--window", "new",
    "--size", MINI_WINDOW_SIZE,
    "new-tab",
    "--profile", MINI_PROFILE_NAME,
    "--startingDirectory", projectRoot,
    "--title", "Touch Fish Read",
    "--suppressApplicationTitle",
    process.execPath,
    touchFishBin,
    "read",
    "--mini-child",
    "--mini-port", String(options.port),
    "--mini-token", options.token,
    "--mini-book", options.bookId,
  ];
}

function launchReadMiniTerminal(options: {
  port: number;
  token: string;
  bookId: string;
}): ChildProcess {
  const child = spawn("wt.exe", buildReadMiniTerminalArguments(options), {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
  return child;
}

function listenOnLocalhost(server: net.Server) {
  return new Promise<number>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate the small-window control port"));
        return;
      }
      resolve(address.port);
    });
  });
}

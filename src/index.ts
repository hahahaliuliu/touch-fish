#!/usr/bin/env node

import { Command } from "commander";
import { startWordCommand } from "./commands/word.js";

const program = new Command();

program
  .name("touchfish")
  .description("A stealth terminal learning tool.")
  .version("0.1.0");

program
  .command("word")
  .description("Start word learning session")
  .action(() => {
    startWordCommand();
  });

program.parse();
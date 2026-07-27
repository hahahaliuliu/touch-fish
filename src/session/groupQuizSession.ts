import type { InterfaceLanguage } from "../models/settings.js";
import type { Word } from "../models/word.js";
import { isGroupQuizAnswerCorrect, type QuizDirection } from "../services/groupQuiz.js";
import { createRandomOrder } from "../services/randomOrder.js";
import { renderGroupQuiz, type QuizWrongAnswer } from "../ui/groupQuizRenderer.js";

interface StartGroupQuizSessionOptions {
  words: Word[];
  interfaceLanguage: InterfaceLanguage;
  onReturn: () => void;
}

let onReturnToWord: (() => void) | undefined;
let words: Word[] = [];
let interfaceLanguage: InterfaceLanguage = "english";
let questionIndex = 0;
let direction: QuizDirection = "english-to-chinese";
let answer = "";
let isShowingResult = false;
let lastAnswerCorrect: boolean | undefined;
let wrongAnswers: QuizWrongAnswer[] = [];

export function startGroupQuizSession(options: StartGroupQuizSessionOptions) {
  onReturnToWord = options.onReturn;
  words = createRandomOrder(options.words.length).map((index) => options.words[index]!);
  interfaceLanguage = options.interfaceLanguage;
  questionIndex = 0;
  direction = "english-to-chinese";
  answer = "";
  isShowingResult = false;
  lastAnswerCorrect = undefined;
  wrongAnswers = [];
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseInputs(key.toString())) {
    if (!handleInput(input)) {
      return;
    }
  }
}

function parseInputs(input: string): string[] {
  const inputs: string[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
      continue;
    }

    if (current) {
      inputs.push(current);
    }
    index += 1;
  }

  return inputs;
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quit();
    return false;
  }

  if (input === "\u001b") {
    returnToWord();
    return false;
  }

  if (isComplete()) {
    if (input === "\r" || input === "\n") {
      returnToWord();
      return false;
    }
    return true;
  }

  if (isShowingResult) {
    if (input === "\r" || input === "\n") {
      moveToNextQuestion();
    }
    return true;
  }

  if (input === "\t") {
    direction = direction === "english-to-chinese" ? "chinese-to-english" : "english-to-chinese";
    answer = "";
    render();
    return true;
  }

  if (input === "\r" || input === "\n") {
    submitAnswer();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    answer = answer.slice(0, -1);
    render();
    return true;
  }

  if (/^[^\u0000-\u001f\u007f]+$/.test(input)) {
    answer += input;
    render();
  }

  return true;
}

function submitAnswer() {
  const word = words[questionIndex];

  if (!word) {
    return;
  }

  lastAnswerCorrect = isGroupQuizAnswerCorrect(word, direction, answer);

  if (!lastAnswerCorrect) {
    wrongAnswers.push({ word, answer });
  }

  isShowingResult = true;
  render();
}

function moveToNextQuestion() {
  questionIndex += 1;
  answer = "";
  isShowingResult = false;
  lastAnswerCorrect = undefined;
  render();
}

function isComplete(): boolean {
  return questionIndex >= words.length;
}

function render() {
  renderGroupQuiz({
    words,
    questionIndex,
    direction,
    answer,
    isShowingResult,
    lastAnswerCorrect,
    wrongAnswers,
    interfaceLanguage,
  });
}

function returnToWord() {
  const onReturn = onReturnToWord;
  onReturnToWord = undefined;
  process.stdin.off("data", handleKeyPress);
  onReturn?.();
}

function quit() {
  console.clear();
  console.log("[INFO] group quiz closed");

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

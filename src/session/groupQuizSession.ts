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

interface GroupQuizState {
  onReturnToWord: (() => void) | undefined;
  words: Word[];
  questionDirections: QuizDirection[];
  interfaceLanguage: InterfaceLanguage;
  questionIndex: number;
  direction: QuizDirection;
  answer: string;
  isShowingResult: boolean;
  lastAnswerCorrect: boolean | undefined;
  wrongAnswers: QuizWrongAnswer[];
}

function createGroupQuizState(options: StartGroupQuizSessionOptions): GroupQuizState {
  const words = createRandomOrder(options.words.length).map((index) => options.words[index]!);
  return {
    onReturnToWord: options.onReturn,
    words,
    questionDirections: words.map(() => "english-to-chinese"),
    interfaceLanguage: options.interfaceLanguage,
    questionIndex: 0,
    direction: "english-to-chinese",
    answer: "",
    isShowingResult: false,
    lastAnswerCorrect: undefined,
    wrongAnswers: [],
  };
}

let state: GroupQuizState = createGroupQuizState({
  words: [],
  interfaceLanguage: "english",
  onReturn: () => {},
});

export function startGroupQuizSession(options: StartGroupQuizSessionOptions) {
  state = createGroupQuizState(options);
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
    if ((input === "r" || input === "R") && state.wrongAnswers.length > 0) {
      retryWrongAnswers();
      return true;
    }

    if (input === "\r" || input === "\n") {
      returnToWord();
      return false;
    }
    return true;
  }

  if (state.isShowingResult) {
    if (input === "\r" || input === "\n") {
      moveToNextQuestion();
    }
    return true;
  }

  if (input === "\t") {
    state.direction = state.direction === "english-to-chinese" ? "chinese-to-english" : "english-to-chinese";
    state.questionDirections[state.questionIndex] = state.direction;
    state.answer = "";
    render();
    return true;
  }

  if (input === "\r" || input === "\n") {
    submitAnswer();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    state.answer = state.answer.slice(0, -1);
    render();
    return true;
  }

  if (/^[^\u0000-\u001f\u007f]+$/.test(input)) {
    state.answer += input;
    render();
  }

  return true;
}

function submitAnswer() {
  const word = state.words[state.questionIndex];

  if (!word) {
    return;
  }

  state.lastAnswerCorrect = isGroupQuizAnswerCorrect(word, state.direction, state.answer);

  if (!state.lastAnswerCorrect) {
    state.wrongAnswers.push({ word, answer: state.answer, direction: state.direction });
  }

  state.isShowingResult = true;
  render();
}

function retryWrongAnswers() {
  state.words = state.wrongAnswers.map(({ word }) => word);
  state.questionDirections = state.wrongAnswers.map(({ direction: wrongDirection }) => wrongDirection);
  state.questionIndex = 0;
  state.direction = state.questionDirections[0] ?? "english-to-chinese";
  state.answer = "";
  state.isShowingResult = false;
  state.lastAnswerCorrect = undefined;
  state.wrongAnswers = [];
  render();
}

function moveToNextQuestion() {
  state.questionIndex += 1;
  state.direction = state.questionDirections[state.questionIndex] ?? "english-to-chinese";
  state.answer = "";
  state.isShowingResult = false;
  state.lastAnswerCorrect = undefined;
  render();
}

function isComplete(): boolean {
  return state.questionIndex >= state.words.length;
}

function render() {
  renderGroupQuiz({
    words: state.words,
    questionIndex: state.questionIndex,
    direction: state.direction,
    answer: state.answer,
    isShowingResult: state.isShowingResult,
    lastAnswerCorrect: state.lastAnswerCorrect,
    wrongAnswers: state.wrongAnswers,
    interfaceLanguage: state.interfaceLanguage,
  });
}

function returnToWord() {
  const onReturn = state.onReturnToWord;
  state.onReturnToWord = undefined;
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

import type { InterfaceLanguage } from "../models/settings.js";
import type { Word } from "../models/word.js";
import type { QuizDirection } from "../services/groupQuiz.js";

export interface QuizWrongAnswer {
  word: Word;
  answer: string;
  direction: QuizDirection;
}

interface RenderGroupQuizOptions {
  words: Word[];
  questionIndex: number;
  direction: QuizDirection;
  answer: string;
  isShowingResult: boolean;
  lastAnswerCorrect: boolean | undefined;
  wrongAnswers: QuizWrongAnswer[];
  interfaceLanguage: InterfaceLanguage;
}

export function renderGroupQuiz(options: RenderGroupQuizOptions) {
  const text = getQuizText(options.interfaceLanguage);
  const currentWord = options.words[options.questionIndex];

  console.clear();

  if (!currentWord) {
    renderSummary(options, text);
    return;
  }

  console.log(text.title);
  console.log("");
  console.log(`${text.question} ${options.questionIndex + 1} / ${options.words.length}`);
  console.log(`${text.direction}: ${getDirectionLabel(options.direction, text)}`);
  console.log("");
  console.log(`  ${getPrompt(currentWord, options.direction)}`);
  console.log("");
  console.log(`${text.answer} ${options.answer || "_"}`);
  console.log("");

  if (options.isShowingResult) {
    console.log(options.lastAnswerCorrect ? text.correct : text.incorrect(getExpectedAnswer(currentWord, options.direction)));
    console.log(text.nextQuestion);
    return;
  }

  console.log(text.answerControls);
}

function renderSummary(options: RenderGroupQuizOptions, text: QuizText) {
  const correctCount = options.words.length - options.wrongAnswers.length;
  const accuracy = options.words.length === 0
    ? 0
    : Math.round((correctCount / options.words.length) * 100);

  console.log(text.summaryTitle);
  console.log("");
  console.log(`${text.correctCount} ${correctCount} / ${options.words.length}`);
  console.log(`${text.incorrectCount} ${options.wrongAnswers.length}`);
  console.log(`${text.accuracy} ${accuracy}%`);

  if (options.wrongAnswers.length > 0) {
    console.log("");
    console.log(text.wrongWords);
    options.wrongAnswers.forEach(({ word, answer, direction }) => {
      console.log(`  ${text.prompt} ${getPrompt(word, direction)}`);
      console.log(`    ${text.yourAnswer} ${answer || text.emptyAnswer}`);
      console.log(`    ${text.expectedAnswer} ${getExpectedAnswer(word, direction)}`);
    });
  }

  console.log("");
  console.log(options.wrongAnswers.length > 0 ? text.summaryControlsWithRetry : text.returnToWord);
}

function getPrompt(word: Word, direction: QuizDirection): string {
  return direction === "english-to-chinese" ? word.english : word.chinese;
}

function getExpectedAnswer(word: Word, direction: QuizDirection): string {
  return direction === "english-to-chinese" ? word.chinese : word.english;
}

function getDirectionLabel(direction: QuizDirection, text: QuizText): string {
  return direction === "english-to-chinese" ? text.englishToChinese : text.chineseToEnglish;
}

interface QuizText {
  title: string;
  question: string;
  direction: string;
  englishToChinese: string;
  chineseToEnglish: string;
  answer: string;
  answerControls: string;
  correct: string;
  incorrect: (answer: string) => string;
  nextQuestion: string;
  summaryTitle: string;
  correctCount: string;
  incorrectCount: string;
  accuracy: string;
  wrongWords: string;
  prompt: string;
  yourAnswer: string;
  expectedAnswer: string;
  emptyAnswer: string;
  returnToWord: string;
  summaryControlsWithRetry: string;
}

function getQuizText(language: InterfaceLanguage): QuizText {
  if (language === "chinese") {
    return {
      title: "Touch Fish 组内测试",
      question: "题目",
      direction: "方向",
      englishToChinese: "英文 -> 中文",
      chineseToEnglish: "中文 -> 英文",
      answer: "答案：",
      answerControls: "Enter 提交 | Tab 切换方向 | Esc 返回背词 | Q 退出",
      correct: "[正确]",
      incorrect: (answer) => `[错误] 正确答案：${answer}`,
      nextQuestion: "按 Enter 进入下一题，或按 Esc 返回背词",
      summaryTitle: "Touch Fish 测试结果",
      correctCount: "正确：",
      incorrectCount: "错误：",
      accuracy: "正确率：",
      wrongWords: "错误单词",
      prompt: "题目：",
      yourAnswer: "你的答案：",
      expectedAnswer: "正确答案：",
      emptyAnswer: "（未填写）",
      returnToWord: "按 Enter 或 Esc 返回背词",
      summaryControlsWithRetry: "按 R 重新测试错误单词，或按 Enter/Esc 返回背词",
    };
  }

  return {
    title: "Touch Fish Group Quiz",
    question: "Question",
    direction: "Direction",
    englishToChinese: "English -> Chinese",
    chineseToEnglish: "Chinese -> English",
    answer: "Answer:",
    answerControls: "Enter submit | Tab switch direction | Esc return to word | Q quit",
    correct: "[CORRECT]",
    incorrect: (answer) => `[INCORRECT] Expected: ${answer}`,
    nextQuestion: "Press Enter for the next question, or Esc to return to word",
    summaryTitle: "Touch Fish Quiz Result",
    correctCount: "Correct:",
    incorrectCount: "Incorrect:",
    accuracy: "Accuracy:",
    wrongWords: "Incorrect Words",
    prompt: "Prompt:",
    yourAnswer: "Your answer:",
    expectedAnswer: "Expected answer:",
    emptyAnswer: "(empty)",
    returnToWord: "Press Enter or Esc to return to word",
    summaryControlsWithRetry: "Press R to retry incorrect words, or Enter/Esc to return to word",
  };
}

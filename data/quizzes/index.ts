import type { QuizSeed } from "../types";
import { csQuizzes } from "./cs";
import { cQuizzes } from "./c";
import { webQuizzes } from "./web";
import { pythonQuizzes } from "./python";

export const quizzes: QuizSeed[] = [
  ...csQuizzes,
  ...cQuizzes,
  ...webQuizzes,
  ...pythonQuizzes,
];

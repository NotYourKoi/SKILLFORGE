import type { LessonSeed } from "../types";
import { csLessons } from "./cs";
import { cLessons } from "./c";
import { webLessons } from "./web";
import { pythonLessons } from "./python";

export const lessons: LessonSeed[] = [
  ...csLessons,
  ...cLessons,
  ...webLessons,
  ...pythonLessons,
];

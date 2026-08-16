export interface SkillSeed {
  id: string;
  name: string;
  description: string;
  tier: string;
  x: number;
  y: number;
  objectives: string[];
  prereqIds: string[];
  difficulty?: string;
  estimatedMinutes?: number;
}

export interface CheckpointSeed {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonSeed {
  skillId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: string;
  content: string;
  checkpoints: CheckpointSeed[];
}

export interface QuizOptionSeed {
  text: string;
  correct: boolean;
}

export interface QuizQuestionSeed {
  prompt: string;
  explanation: string;
  options: QuizOptionSeed[];
}

export interface QuizSeed {
  skillId: string;
  title: string;
  passScore: number;
  questions: QuizQuestionSeed[];
}

export interface ModuleSeed {
  id: string;
  title: string;
  description: string;
  order: number;
  objectives: string[];
  skillIds: string[];
}

export interface CourseSeed {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  objectives: string[];
  modules: ModuleSeed[];
}

export interface ExerciseExampleSeed {
  input: string;
  output: string;
  note?: string;
}

export interface ExerciseTestCaseSeed {
  input: string;
  expectedOutput: string;
  description: string;
  order: number;
  isPublic?: boolean;
}

export interface ExerciseSeed {
  id: string;
  skillId: string;
  title: string;
  prompt: string;
  description: string;
  requirements: string[];
  examples: ExerciseExampleSeed[];
  constraints: string[];
  language: string;
  starterCode: string;
  solution: string;
  hints: string[];
  difficulty: string;
  order: number;
  testCases: ExerciseTestCaseSeed[];
}

export interface ProjectSeed {
  id: string;
  skillId: string;
  relatedSkillIds: string[];
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  order: number;
  objectives: string[];
  requirements: string[];
  hints: string[];
  milestones: string[];
  expectedOutput: string;
}

export type TutorMode = "EXPLAIN" | "HINT" | "DEBUG" | "EXPLAIN_ANSWER" | "ASK";

export const TUTOR_MODES: readonly TutorMode[] = [
  "EXPLAIN",
  "HINT",
  "DEBUG",
  "EXPLAIN_ANSWER",
  "ASK",
];

export function isTutorMode(value: unknown): value is TutorMode {
  return typeof value === "string" && (TUTOR_MODES as readonly string[]).includes(value);
}

export type AIProviderName = "gemini" | "omniroute";

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIChatOptions {
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export interface AIProviderResult {
  content: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export interface AIProvider {
  readonly name: AIProviderName;
  readonly model: string;
  chat(messages: AIChatMessage[], options?: AIChatOptions): Promise<AIProviderResult>;
}

export interface AIProviderConfig {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface TutorContextData {
  skill?: {
    id: string;
    name: string;
    description: string;
    tier: string;
    objectives: string[];
    difficulty: string;
  };
  lesson?: {
    title: string;
    description: string;
    objectives: string[];
    difficulty: string;
  };
  exercise?: {
    title: string;
    prompt: string;
    description: string;
    language: string;
    difficulty: string;
    requirements: string[];
    constraints: string[];
    examples: string[];
  };
  quiz?: {
    question: string;
    options: string[];
    afterSubmit: boolean;
    selectedOption?: string;
    correctOption?: string;
    explanation?: string;
  };
  userProgress?: {
    level: number;
    totalXp: number;
    currentStreak: number;
    skillsCompleted: number;
    lessonsCompleted: number;
    exercisesSolved: number;
    completedSkillNames: string[];
  };
  prerequisites?: string[];
  /** Internal carrier for the sanitized debug section; never rendered by buildTutorContext. */
  _debug?: string;
}

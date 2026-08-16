import { codeToHtml } from "shiki";

const DEFAULT_THEME = "github-light";

export const LESSON_CODE_LANGUAGES: Record<string, string> = {
  text: "Plain text",
  bash: "Bash",
  c: "C",
  css: "CSS",
  html: "HTML",
  http: "HTTP",
  js: "JavaScript",
  jsx: "JSX",
  python: "Python",
};

export function languageLabel(language: string): string {
  return LESSON_CODE_LANGUAGES[language] ?? (language ? language.toUpperCase() : "Code");
}

export async function highlightCode(code: string, language: string): Promise<string> {
  const lang = language in LESSON_CODE_LANGUAGES ? language : "text";
  return codeToHtml(code, { lang, theme: DEFAULT_THEME });
}

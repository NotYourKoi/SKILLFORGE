export interface GradedQuestion {
  questionId: string;
  correctOptionId: string | null;
}

export interface GradeInput {
  correctAnswers: Map<string, string>;
  selected: Record<string, string>;
}

export interface GradeResult {
  score: number;
  correctCount: number;
  total: number;
  passed: boolean;
}

/**
 * Drops every selected answer whose option id does not actually belong to its
 * question. `selected` is client-controlled, so without this a crafted request
 * could reference another question's option (recorded garbage data or a
 * foreign-key failure). Invalid answers are simply treated as unanswered —
 * they grade as incorrect either way.
 */
export function filterValidSelectedAnswers(
  validOptionIdsByQuestion: ReadonlyMap<string, ReadonlySet<string>>,
  selected: Record<string, string>,
): Record<string, string> {
  const valid: Record<string, string> = {};
  for (const [questionId, optionId] of Object.entries(selected)) {
    const validIds = validOptionIdsByQuestion.get(questionId);
    if (validIds && validIds.has(optionId)) valid[questionId] = optionId;
  }
  return valid;
}

/**
 * Grading: score = round(correct / total * 100), pass if score >= passScore.
 * Selected answers that don't match any option are counted as incorrect.
 */
export function gradeQuiz(
  correctAnswers: Map<string, string>,
  selected: Record<string, string>,
  passScore: number,
): GradeResult {
  const total = correctAnswers.size;
  let correctCount = 0;

  for (const [questionId, correctOptionId] of correctAnswers) {
    if (selected[questionId] === correctOptionId) {
      correctCount++;
    }
  }

  const score = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  return {
    score,
    correctCount,
    total,
    passed: score >= passScore,
  };
}

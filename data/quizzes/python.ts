import type { QuizSeed } from "../types";

export const pythonQuizzes: QuizSeed[] = [
  {
    skillId: "PY_BASICS",
    title: "Python Basics Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "How are code blocks delimited in Python?",
        explanation: "Python uses indentation to define blocks — no braces or begin/end keywords.",
        options: [
          { text: "Indentation", correct: true },
          { text: "Curly braces { }", correct: false },
          { text: "begin and end keywords", correct: false },
          { text: "Semicolons", correct: false },
        ],
      },
      {
        prompt: "What does f\"{name} is {age}\" do?",
        explanation: "An f-string interpolates the values of the variables into the string.",
        options: [
          { text: "Interpolates the values of name and age", correct: true },
          { text: "Formats the string as a file", correct: false },
          { text: "Escapes special characters", correct: false },
          { text: "Converts the string to bytes", correct: false },
        ],
      },
      {
        prompt: "Which collection keeps only unique values?",
        explanation: "A set automatically de-duplicates; adding an existing value is a no-op.",
        options: [
          { text: "set", correct: true },
          { text: "list", correct: false },
          { text: "tuple", correct: false },
          { text: "dict", correct: false },
        ],
      },
      {
        prompt: "What does the with statement guarantee when opening a file?",
        explanation: "The file is closed automatically when the block exits, even on errors.",
        options: [
          { text: "The file is closed automatically on exit", correct: true },
          { text: "The file is read-only", correct: false },
          { text: "The file is created if missing", correct: false },
          { text: "The file is encrypted", correct: false },
        ],
      },
      {
        prompt: "When does code under if __name__ == \"__main__\": run?",
        explanation: "Only when the file is executed directly, not when imported as a module.",
        options: [
          { text: "Only when the file is run directly", correct: true },
          { text: "Always, on import and direct execution", correct: false },
          { text: "Only when the file is imported", correct: false },
          { text: "Never; it is a comment", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "PY_DATA",
    title: "Python Data Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which collection is best for a fast key→value lookup?",
        explanation: "A dict provides O(1) average lookup by key.",
        options: [
          { text: "dict", correct: true },
          { text: "list", correct: false },
          { text: "tuple", correct: false },
          { text: "str", correct: false },
        ],
      },
      {
        prompt: "What does [n * n for n in range(5)] produce?",
        explanation: "A list comprehension builds [0, 1, 4, 9, 16].",
        options: [
          { text: "[0, 1, 4, 9, 16]", correct: true },
          { text: "[0, 1, 2, 3, 4]", correct: false },
          { text: "[1, 4, 9, 16, 25]", correct: false },
          { text: "[0, 2, 6, 12, 20]", correct: false },
        ],
      },
      {
        prompt: "Why is b = a not a copy when a is a list?",
        explanation: "It only aliases the same list object; both names refer to the same data.",
        options: [
          { text: "Both names reference the same list object", correct: true },
          { text: "Python copies lists on assignment", correct: false },
          { text: "Lists cannot be copied", correct: false },
          { text: "b becomes a string", correct: false },
        ],
      },
      {
        prompt: "Which standard library module parses JSON?",
        explanation: "The json module provides json.loads / json.dump for JSON.",
        options: [
          { text: "json", correct: true },
          { text: "csv", correct: false },
          { text: "math", correct: false },
          { text: "os", correct: false },
        ],
      },
      {
        prompt: "What is the key advantage of pandas DataFrames over plain lists?",
        explanation: "DataFrames give tabular structure with columns, indexing and rich grouping/filtering operations.",
        options: [
          { text: "Tabular structure with columns and rich operations", correct: true },
          { text: "They are always faster than numpy arrays", correct: false },
          { text: "They remove the need to import modules", correct: false },
          { text: "They automatically train models", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "PY_ML",
    title: "Python Machine Learning Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Predicting whether an email is spam is an example of what?",
        explanation: "Spam detection predicts a category, so it is classification.",
        options: [
          { text: "Classification", correct: true },
          { text: "Regression", correct: false },
          { text: "Clustering", correct: false },
          { text: "Dimensionality reduction", correct: false },
        ],
      },
      {
        prompt: "Why is the test set kept separate from training?",
        explanation: "Held-out data measures how well the model generalizes to unseen examples.",
        options: [
          { text: "To measure generalization to unseen data", correct: true },
          { text: "To make the model train faster", correct: false },
          { text: "To satisfy a licensing requirement", correct: false },
          { text: "To allow manual review of predictions", correct: false },
        ],
      },
      {
        prompt: "What is overfitting?",
        explanation: "The model performs well on training data but poorly on test data because it memorized noise.",
        options: [
          { text: "Great on train, poor on test", correct: true },
          { text: "Poor on both train and test", correct: false },
          { text: "Great on both train and test", correct: false },
          { text: "Refusing to train at all", correct: false },
        ],
      },
      {
        prompt: "What is the correct way to use a StandardScaler with train and test sets?",
        explanation: "Fit the scaler on training data only, then transform both — fitting on test leaks information.",
        options: [
          { text: "fit on train only, transform both", correct: true },
          { text: "fit on the combined data", correct: false },
          { text: "fit on test, transform train", correct: false },
          { text: "scalers do not need fitting", correct: false },
        ],
      },
      {
        prompt: "Which metric is most informative when classes are heavily imbalanced?",
        explanation: "Precision and recall reveal performance per class, which raw accuracy hides.",
        options: [
          { text: "Precision and recall", correct: true },
          { text: "Accuracy alone", correct: false },
          { text: "Training loss only", correct: false },
          { text: "Number of model parameters", correct: false },
        ],
      },
    ],
  },
];

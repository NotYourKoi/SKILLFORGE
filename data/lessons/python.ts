import type { LessonSeed } from "../types";

export const pythonLessons: LessonSeed[] = [
  {
    skillId: "PY_BASICS",
    title: "Python Fundamentals",
    description:
      "Readable syntax, indentation-based blocks, and the core data types that make Python almost like English.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Write and run a Python program
- Use variables, the basic data types and f-strings
- Control flow with if/elif and loops

## Explanation

**Python** is a high-level, readable language famous for concise code. Indentation is part of the syntax — blocks are defined by leading whitespace, not braces.

\`\`\`python
name = "Aria"
age = 21
height = 1.68
is_student = True

print(f"{name} is {age} years old")
\`\`\`

Conditionals and loops:

\`\`\`python
score = 82

if score >= 90:
    grade = "A"
elif score >= 70:
    grade = "B"
else:
    grade = "C"

for i in range(3):
    print(i)          # 0 1 2

while len(name) < 10:
    name += "!"
\`\`\`

Core data types: \`int\`, \`float\`, \`str\`, \`bool\`, plus collections \`list\`, \`tuple\`, \`dict\`, \`set\`. Python is dynamically typed — no type annotations required (though they are recommended and supported).

## Summary

Python uses indentation for structure and reads almost like English. Master variables, f-strings, \`if\`/\`elif\`, and \`for\`/\`while\` and you have the foundation for everything else.`,
    checkpoints: [
      {
        question: "How does Python define a block of code?",
        options: [
          "With curly braces",
          "With indentation",
          "With begin/end keywords",
          "With parentheses",
        ],
        correctIndex: 1,
        explanation:
          "Python uses leading whitespace (indentation) to define blocks — consistent indentation is part of the syntax, not just style.",
      },
    ],
  },
  {
    skillId: "PY_BASICS",
    title: "Functions & Data Structures",
    description:
      "def functions, the four core collections, and Pythonic one-liners like comprehensions and slicing.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Define and call functions with parameters and defaults
- Use lists, dicts, tuples and sets effectively
- Understand comprehensions and slicing

## Explanation

Functions are defined with \`def\`. Return values explicitly, use defaults, and pass arguments by keyword for clarity:

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Aria"))           # Hello, Aria!
print(greet("Kael", "Yo"))     # Yo, Kael!
\`\`\`

The four core collections:

\`\`\`python
nums = [1, 2, 3]           # list: ordered, mutable
fixed = (1, 2)             # tuple: ordered, immutable
user = {"name": "Aria"}    # dict: key -> value
tags = {"web", "py"}       # set: unique values
\`\`\`

Comprehensions build collections in one line:

\`\`\`python
squares = [n * n for n in range(10) if n % 2 == 0]
# [0, 4, 16, 36, 64]

name = "SkillForge"
first_three = name[:3]     # slicing -> "Ski"
\`\`\`

Dicts are the workhorse of Python — like JavaScript objects, accessed with \`user["name"]\` or \`user.get("name")\`.

## Summary

Functions keep logic reusable; lists, dicts, tuples and sets store data in the right shape. Comprehensions and slicing are Pythonic one-liners worth memorizing.`,
    checkpoints: [
      {
        question: "Which collection would you use to store values that must never change, like coordinates?",
        options: ["list", "tuple", "set", "dict"],
        correctIndex: 1,
        explanation:
          "Tuples are ordered and immutable — ideal for fixed records like coordinates. Lists are mutable, sets hold unique values, and dicts map keys to values.",
      },
    ],
  },
  {
    skillId: "PY_BASICS",
    title: "Errors, Files & Modules",
    description:
      "Handling exceptions with try/except, safe file IO with with, and organizing code into modules.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Read stack traces and handle exceptions
- Read and write files safely with context managers
- Import and structure code as modules

## Explanation

Exceptions are runtime errors. Handle expected failures with \`try\`/\`except\` instead of letting the program crash:

\`\`\`python
try:
    value = int("not-a-number")
except ValueError as err:
    print("Bad input:", err)
finally:
    print("always runs")
\`\`\`

Read and write files with the \`with\` statement — it closes the file automatically, even on errors:

\`\`\`python
with open("notes.txt", "r") as f:
    content = f.read()

with open("log.txt", "w") as f:
    f.write("entry")
\`\`\`

Organize code into **modules** (files) and **packages** (folders with \`__init__.py\`):

\`\`\`python
import math
from datetime import date

today = date.today()
print(math.sqrt(16), today)
\`\`\`

The \`if __name__ == "__main__":\` guard runs code only when the file is executed directly, not imported.

## Summary

Handle expected errors with try/except, use \`with\` for file IO, and structure logic in modules. Together these make scripts that survive real input.`,
    checkpoints: [
      {
        question: "What does the with statement guarantee for file handling?",
        options: [
          "The file is compressed",
          "The file is closed automatically, even on errors",
          "The file is locked against other programs",
          "Nothing — with is just syntax sugar",
        ],
        correctIndex: 1,
        explanation:
          "The with statement is a context manager — it closes the file automatically when the block exits, even if an exception is raised.",
      },
    ],
  },
  {
    skillId: "PY_DATA",
    title: "Lists, Tuples & Dictionaries",
    description:
      "Choosing the right collection, transforming data, and avoiding the mutable-copying trap.",
    estimatedMinutes: 10,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Choose the right collection for the job
- Sort, filter and transform data
- Understand mutability and copying

## Explanation

Choosing the collection is a design decision:

- **List** — ordered, mutable, duplicates allowed. Default choice for a sequence.
- **Tuple** — ordered, immutable. Good for fixed records (coordinates, config pairs).
- **Dict** — key→value lookup. Fast membership by key.
- **Set** — unique values, fast membership tests and deduplication.

Common operations:

\`\`\`python
scores = [90, 85, 95]

scores.append(88)            # [90, 85, 95, 88]
top = sorted(scores, reverse=True)[:3]
above_90 = [s for s in scores if s > 90]

seen = {1, 2, 3}
seen.add(3)                  # no-op, already present

lookup = {"C": 3, "Java": 5}
print(lookup.get("C"))       # 3
\`\`\`

Mutability trap: \`b = a\` does **not** copy a list — it aliases it. Copy explicitly:

\`\`\`python
a = [1, 2]
b = a.copy()          # independent copy
b.append(3)           # a unchanged
\`\`\`

## Summary

Lists are the default; tuples for fixed records, dicts for lookups, sets for uniqueness. Always copy before mutating when you need independence.`,
    checkpoints: [
      {
        question: "After b = a with a = [1, 2], what happens when you append to b?",
        options: [
          "a stays [1, 2]",
          "a also changes because b aliases a",
          "b becomes a tuple",
          "It raises an error",
        ],
        correctIndex: 1,
        explanation:
          "b = a does not copy the list — both names refer to the same object, so mutating one affects the other. Use a.copy() for an independent copy.",
      },
    ],
  },
  {
    skillId: "PY_DATA",
    title: "Working with CSV & JSON",
    description:
      "Turning files into Python structures and back, with the csv and json standard-library modules.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Read and write CSV with the csv module
- Parse and generate JSON with json
- Build data pipelines from file to structured data

## Explanation

Data rarely arrives as clean Python objects — it arrives as files. The standard library has you covered.

CSV:

\`\`\`python
import csv

with open("skills.csv", newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)          # [{"id": "C", "tier": "1"}, ...]

with open("out.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "tier"])
    writer.writeheader()
    writer.writerow({"id": "JS", "tier": "2"})
\`\`\`

JSON — the format APIs use:

\`\`\`python
import json

data = {"skills": ["C", "JS", "Python"], "total": 3}
text = json.dumps(data, indent=2)
parsed = json.loads(text)

with open("data.json", "w") as f:
    json.dump(data, f, indent=2)
\`\`\`

A mini pipeline: read CSV, filter rows, write JSON:

\`\`\`python
import csv, json

with open("skills.csv", newline="") as f:
    rows = list(csv.DictReader(f))

advanced = [r for r in rows if r["tier"] == "advanced"]

with open("advanced.json", "w") as f:
    json.dump(advanced, f, indent=2)
\`\`\`

## Summary

\`csv\` and \`json\` turn files into Python structures and back. Chains of read → transform → write are the essence of data work.`,
    checkpoints: [
      {
        question: "Which function parses a JSON string into a Python object?",
        options: ["json.dumps", "json.loads", "json.parse", "csv.reader"],
        correctIndex: 1,
        explanation:
          "json.loads parses a JSON string into Python objects; json.dumps serializes Python objects into a JSON string.",
      },
    ],
  },
  {
    skillId: "PY_DATA",
    title: "NumPy & Pandas Basics",
    description:
      "Vectorized NumPy arrays and tabular pandas DataFrames — the core of the Python data stack.",
    estimatedMinutes: 15,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Create NumPy arrays and understand vectorized operations
- Load tabular data into a pandas DataFrame
- Filter, group and summarize data

## Explanation

For real data work, install **NumPy** and **pandas**. NumPy gives fast numeric arrays; pandas gives tabular \`DataFrame\`s.

NumPy is *vectorized* — operations apply to whole arrays without Python loops:

\`\`\`python
import numpy as np

a = np.array([1, 2, 3])
b = a * 2                 # array([2, 4, 6])
total = a.sum()           # 6
mean = a.mean()           # 2.0
grid = np.random.randint(0, 100, size=(3, 3))
\`\`\`

pandas for tables:

\`\`\`python
import pandas as pd

df = pd.DataFrame({
    "name": ["Aria", "Kael"],
    "score": [92, 78],
})

df["passed"] = df["score"] >= 80
high = df[df["score"] >= 80]          # boolean filtering
by_score = df.sort_values("score", ascending=False)
grouped = df.groupby("passed")["score"].mean()
\`\`\`

Read CSVs directly: \`df = pd.read_csv("data.csv")\`. It infers column types and indexes rows automatically.

## Summary

NumPy = fast vectorized numeric arrays; pandas = tabular DataFrames. Filter with boolean masks, group with \`groupby\`, and load data with \`pd.read_csv\`. That covers most analysis workflows.`,
    checkpoints: [
      {
        question: "What does the expression df[df['score'] >= 80] do?",
        options: [
          "Returns the rows where score is at least 80",
          "Adds a column",
          "Sorts the DataFrame",
          "Drops missing values",
        ],
        correctIndex: 0,
        explanation:
          "Boolean indexing filters a DataFrame to the rows where the condition is True — here, the rows with score >= 80.",
      },
    ],
  },
  {
    skillId: "PY_ML",
    title: "Machine Learning Overview",
    description:
      "Classification, regression and clustering — and why you must evaluate on data the model never trained on.",
    estimatedMinutes: 12,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Distinguish supervised and unsupervised learning
- Describe classification, regression and clustering
- Explain the train/test split and evaluation

## Explanation

**Machine learning** is building programs that improve with data. Instead of writing rules, you train a model on examples.

Three problem families:

- **Classification** — predict a *category*. Spam vs. not-spam, pass vs. fail.
- **Regression** — predict a *number*. Test score, price, temperature.
- **Clustering** — find *groups* in unlabeled data. Segmenting users by behavior.

The workflow:

\`\`\`text
data -> split -> train -> evaluate -> predict
        |        |
      train   test (held out!)
\`\`\`

Split the data into a training set and a held-out test set. Train only on training data; the test set measures how well the model *generalizes* to unseen examples. Overfitting = great on train, poor on test.

Evaluation: accuracy for classification (\`correct / total\`), mean squared error for regression. For class imbalance, precision and recall matter more than raw accuracy.

## Summary

ML predicts categories (classification), numbers (regression) or groups (clustering). Always evaluate on data the model never trained on. That discipline separates real ML from curve-fitting.`,
    checkpoints: [
      {
        question: "What is overfitting?",
        options: [
          "The model performs great on train data but poorly on unseen test data",
          "The model performs poorly everywhere",
          "The model is too small to learn",
          "The dataset is too large",
        ],
        correctIndex: 0,
        explanation:
          "Overfitting (high variance) means the model memorized the training data instead of generalizing — it scores high on train but fails on the held-out test set.",
      },
    ],
  },
  {
    skillId: "PY_ML",
    title: "Data Preprocessing with scikit-learn",
    description:
      "Splitting data, scaling features, and the uniform fit/predict API of scikit-learn.",
    estimatedMinutes: 15,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Split data with train_test_split
- Scale numeric features
- Encode categorical labels
- Build and evaluate a first classifier

## Explanation

**scikit-learn** is the classic Python ML library. Real pipelines start with preprocessing, not modeling.

Split and scale:

\`\`\`python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)  # fit only on train!
\`\`\`

Note: \`fit\` the scaler on training data only; use \`transform\` on test data. Fitting on the test set leaks information and inflates results.

A first classifier — decision tree:

\`\`\`python
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

model = DecisionTreeClassifier(random_state=42)
model.fit(X_train_scaled, y_train)
y_pred = model.predict(X_test_scaled)

print(accuracy_score(y_test, y_pred))
\`\`\`

The pattern is uniform across scikit-learn: \`fit(X, y)\` then \`predict(X)\`. Swap the model and the pipeline barely changes.

## Summary

Split data, fit scalers only on training data, then train and evaluate a model. scikit-learn's uniform fit/predict API makes every model interchangeable.`,
    checkpoints: [
      {
        question: "Why must you fit the scaler only on training data?",
        options: [
          "It is faster",
          "Fitting on test data leaks information and inflates results",
          "The test set cannot be transformed",
          "Scalers only work on training splits",
        ],
        correctIndex: 1,
        explanation:
          "The scaler must learn its parameters from training data only. Fitting on the test set leaks information about the test distribution into the pipeline, which inflates evaluation scores.",
      },
    ],
  },
  {
    skillId: "PY_ML",
    title: "Model Evaluation & Small Learning Project",
    description:
      "Confusion matrices, cross-validation, and diagnosing bias versus variance to finish a real pipeline.",
    estimatedMinutes: 15,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Use confusion matrices and cross-validation
- Diagnose bias vs. variance
- Build a complete small pipeline end to end

## Explanation

A confusion matrix shows where a classifier goes wrong:

\`\`\`text
               predicted
             no    yes
actual no   TN      FP
actual yes  FN      TP
\`\`\`

- **Accuracy** — (TP+TN)/all. Misleading on imbalanced data.
- **Precision** — TP/(TP+FP). Of predicted yes, how many correct?
- **Recall** — TP/(TP+FN). Of actual yes, how many found?

**Cross-validation** trains on slices of the data repeatedly and averages the scores — a more honest estimate than a single split:

\`\`\`python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X, y, cv=5)
print(scores.mean())
\`\`\`

Diagnosis: **high bias** (underfitting) = poor on both train and test. **High variance** (overfitting) = great on train, poor on test. Fix bias with a stronger model or better features; fix variance with more data, regularization or simpler models.

A complete pipeline — predicting pass/fail:

\`\`\`python
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("scale", StandardScaler()),
    ("model", DecisionTreeClassifier(random_state=42)),
])

pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))
\`\`\`

## Summary

Evaluate with confusion matrices, cross-validation and precision/recall on imbalanced data. Distinguish bias (underfitting) from variance (overfitting), and wrap preprocessing plus model in a Pipeline for a clean end-to-end project.`,
    checkpoints: [
      {
        question: "A model scores 99% on train but 60% on test. This is:",
        options: [
          "High bias (underfitting)",
          "High variance (overfitting)",
          "Normal behavior",
          "A data leak in the test set",
        ],
        correctIndex: 1,
        explanation:
          "A big gap between train and test scores signals overfitting — high variance. The model memorized the training data and fails to generalize.",
      },
    ],
  },
];

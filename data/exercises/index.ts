import type { ExerciseSeed } from "../types";

/**
 * Coding exercises, grouped by skill. Each exercise carries its own test
 * cases and is language-tagged so a future sandboxed runner can execute it.
 * Only a starter set is provided; more can be added as plain data.
 *
 * Test cases with `isPublic: false` are hidden from the learner UI and are
 * only ever sent to the execution provider server-side for grading.
 */
export const exercises: ExerciseSeed[] = [
  {
    id: "PY_BASICS_EX_HELLO",
    skillId: "PY_BASICS",
    title: "Hello, World!",
    prompt: "Print the message: Hello, World!",
    description: "A warm-up: get your very first Python program running.",
    requirements: [
      "Print exactly one line of output.",
      "The output must be: Hello, World!",
    ],
    examples: [
      {
        input: "",
        output: "Hello, World!",
        note: "No input is read for this exercise.",
      },
    ],
    constraints: ["Do not read from input() in this exercise."],
    language: "python",
    starterCode: "# Write your code here\n",
    solution: 'print("Hello, World!")\n',
    hints: [
      "Use the print() function with a string.",
      "Wrap the message in double quotes so Python treats it as text.",
    ],
    difficulty: "Easy",
    order: 0,
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, World!",
        description: "Prints the greeting",
        order: 0,
      },
      {
        input: "",
        expectedOutput: "Hello, World!",
        description: "Output is a single exact line",
        order: 1,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_BASICS_EX_SUM",
    skillId: "PY_BASICS",
    title: "Add Two Numbers",
    prompt: "Read two integers a and b from input and print their sum.",
    description:
      "Turn input() results into integers and combine them with the + operator.",
    requirements: [
      "Read two integers, one per line, from standard input.",
      "Print a single integer: the sum of the two numbers.",
    ],
    examples: [
      {
        input: "2\n3",
        output: "5",
        note: "2 + 3 = 5",
      },
    ],
    constraints: ["You may assume both inputs are valid integers."],
    language: "python",
    starterCode: "a = int(input())\nb = int(input())\n",
    solution: "a = int(input())\nb = int(input())\nprint(a + b)\n",
    hints: [
      "Read each number with input()",
      "Convert strings to integers with int()",
      "Add the values with +",
    ],
    difficulty: "Easy",
    order: 1,
    testCases: [
      {
        input: "2\n3",
        expectedOutput: "5",
        description: "2 + 3 = 5",
        order: 0,
      },
      {
        input: "10\n-4",
        expectedOutput: "6",
        description: "Handles negative numbers",
        order: 1,
        isPublic: false,
      },
      {
        input: "0\n0",
        expectedOutput: "0",
        description: "Zero plus zero",
        order: 2,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_BASICS_EX_EVEN_ODD",
    skillId: "PY_BASICS",
    title: "Even or Odd",
    prompt: "Read an integer n and print even if n is even, otherwise print odd.",
    description:
      "Practise the modulo operator % and a simple conditional branch.",
    requirements: [
      "Read one integer n from standard input.",
      "Print the word even when n is divisible by 2.",
      "Print the word odd otherwise.",
      "Output is lowercase and matches exactly.",
    ],
    examples: [
      {
        input: "4",
        output: "even",
        note: "4 % 2 == 0",
      },
      {
        input: "7",
        output: "odd",
        note: "7 % 2 == 1",
      },
    ],
    constraints: ["n will fit inside a regular integer."],
    language: "python",
    starterCode: "n = int(input())\n",
    solution: "n = int(input())\nprint(\"even\" if n % 2 == 0 else \"odd\")\n",
    hints: [
      "The % operator returns the remainder of a division.",
      "n % 2 == 0 means n is even.",
      "Use an if/else branch to pick the right word.",
    ],
    difficulty: "Easy",
    order: 2,
    testCases: [
      {
        input: "4",
        expectedOutput: "even",
        description: "4 is even",
        order: 0,
      },
      {
        input: "7",
        expectedOutput: "odd",
        description: "7 is odd",
        order: 1,
      },
      {
        input: "0",
        expectedOutput: "even",
        description: "Zero is even",
        order: 2,
        isPublic: false,
      },
      {
        input: "-3",
        expectedOutput: "odd",
        description: "Negative odd",
        order: 3,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_DATA_EX_LIST_SUM",
    skillId: "PY_DATA",
    title: "Sum a List",
    prompt: "Read a list of integers and print their total.",
    description:
      "Combine a list of numbers into a single total using iteration.",
    requirements: [
      "Read an integer n: the number of values.",
      "Read n integers, each on its own line.",
      "Print the sum of all the integers.",
    ],
    examples: [
      {
        input: "3\n1\n2\n3",
        output: "6",
        note: "1 + 2 + 3 = 6",
      },
    ],
    constraints: ["n will be at least 1.", "Values fit inside a regular integer."],
    language: "python",
    starterCode: "n = int(input())\n",
    solution: "n = int(input())\ntotal = 0\nfor _ in range(n):\n    total += int(input())\nprint(total)\n",
    hints: [
      "Loop exactly n times using range(n).",
      "Keep a running total with a variable starting at 0.",
      "Use += to add each value to the total.",
    ],
    difficulty: "Easy",
    order: 0,
    testCases: [
      {
        input: "3\n1\n2\n3",
        expectedOutput: "6",
        description: "1 + 2 + 3 = 6",
        order: 0,
      },
      {
        input: "1\n42",
        expectedOutput: "42",
        description: "Single element list",
        order: 1,
        isPublic: false,
      },
      {
        input: "5\n-1\n0\n2\n-4\n8",
        expectedOutput: "5",
        description: "Mixes negatives and positives",
        order: 2,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_DATA_EX_LARGEST",
    skillId: "PY_DATA",
    title: "Find the Largest",
    prompt: "Read n integers and print the largest value.",
    description:
      "Track a running maximum while scanning a sequence of numbers.",
    requirements: [
      "Read an integer n: the number of values.",
      "Read n integers, each on its own line.",
      "Print the largest of the integers.",
    ],
    examples: [
      {
        input: "4\n3\n9\n2\n7",
        output: "9",
        note: "9 is the largest value.",
      },
    ],
    constraints: ["n will be at least 1."],
    language: "python",
    starterCode: "n = int(input())\n",
    solution: "n = int(input())\nlargest = int(input())\nfor _ in range(n - 1):\n    value = int(input())\n    if value > largest:\n        largest = value\nprint(largest)\n",
    hints: [
      "Seed the running maximum with the first value.",
      "Compare every following value against the running maximum.",
      "Update the maximum when a value is larger.",
    ],
    difficulty: "Medium",
    order: 1,
    testCases: [
      {
        input: "4\n3\n9\n2\n7",
        expectedOutput: "9",
        description: "Largest in the middle",
        order: 0,
      },
      {
        input: "1\n-5",
        expectedOutput: "-5",
        description: "Single negative value",
        order: 1,
        isPublic: false,
      },
      {
        input: "6\n10\n4\n8\n10\n3\n2",
        expectedOutput: "10",
        description: "Repeated largest",
        order: 2,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_ML_EX_COUNT_POSITIVE",
    skillId: "PY_ML",
    title: "Count Positive Values",
    prompt: "Read a list of integers and count how many are positive.",
    description:
      "A small data-scanning task that mirrors feature-labelling work in ML.",
    requirements: [
      "Read an integer n: the number of values.",
      "Read n integers, each on its own line.",
      "Print the number of values strictly greater than 0.",
    ],
    examples: [
      {
        input: "5\n3\n-1\n0\n4\n-2",
        output: "2",
        note: "3 and 4 are positive; 0 is not.",
      },
    ],
    constraints: ["n will be at least 1."],
    language: "python",
    starterCode: "n = int(input())\n",
    solution: "n = int(input())\ncount = 0\nfor _ in range(n):\n    if int(input()) > 0:\n        count += 1\nprint(count)\n",
    hints: [
      "Initialise a counter at 0.",
      "Increment the counter only when a value is greater than 0.",
      "Remember 0 is not positive.",
    ],
    difficulty: "Easy",
    order: 0,
    testCases: [
      {
        input: "5\n3\n-1\n0\n4\n-2",
        expectedOutput: "2",
        description: "Mixed values",
        order: 0,
      },
      {
        input: "2\n-5\n-8",
        expectedOutput: "0",
        description: "All negative",
        order: 1,
        isPublic: false,
      },
      {
        input: "4\n1\n2\n3\n4",
        expectedOutput: "4",
        description: "All positive",
        order: 2,
        isPublic: false,
      },
    ],
  },
  {
    id: "PY_ML_EX_MEAN",
    skillId: "PY_ML",
    title: "Compute the Mean",
    prompt: "Read n integers and print their arithmetic mean.",
    description:
      "Averaging values is a core step in normalising datasets before modelling.",
    requirements: [
      "Read an integer n: the number of values.",
      "Read n integers, each on its own line.",
      "Print the mean as a decimal rounded to 2 places.",
    ],
    examples: [
      {
        input: "4\n2\n4\n6\n8",
        output: "5.00",
        note: "(2 + 4 + 6 + 8) / 4 = 5.0",
      },
    ],
    constraints: ["n will be at least 1.", "The exact mean will have at most 2 decimals."],
    language: "python",
    starterCode: "n = int(input())\n",
    solution: "n = int(input())\ntotal = 0\nfor _ in range(n):\n    total += int(input())\nprint(f\"{total / n:.2f}\")\n",
    hints: [
      "Sum all values first.",
      "Divide the total by the count n.",
      "Format to 2 decimal places with f\"{value:.2f}\".",
    ],
    difficulty: "Medium",
    order: 1,
    testCases: [
      {
        input: "4\n2\n4\n6\n8",
        expectedOutput: "5.00",
        description: "Even spread",
        order: 0,
      },
      {
        input: "3\n10\n0\n-10",
        expectedOutput: "0.00",
        description: "Values cancel out",
        order: 1,
        isPublic: false,
      },
      {
        input: "2\n1\n2",
        expectedOutput: "1.50",
        description: "Half value",
        order: 2,
        isPublic: false,
      },
    ],
  },
];

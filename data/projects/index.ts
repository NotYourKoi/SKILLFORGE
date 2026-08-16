import type { ProjectSeed } from "../types";

/**
 * Projects, grouped by skill. Each project links to the skills it exercises
 * (primary `skillId` plus any `relatedSkillIds`), carries progressive hints,
 * and is split into checkable milestones.
 *
 * Only projects that fit the current SkillForge skill structure are seeded —
 * a small, well-built progression beats a large shallow catalog.
 */
export const projects: ProjectSeed[] = [
  {
    id: "PY_BASICS_PRJ_GUESSING",
    skillId: "PY_BASICS",
    relatedSkillIds: ["PY_BASICS", "CS_BASICS"],
    title: "Number Guessing Game",
    description:
      "A command-line game where the computer picks a secret number and the player has to guess it in as few tries as possible.",
    category: "CLI Game",
    difficulty: "Beginner",
    estimatedMinutes: 60,
    order: 0,
    objectives: [
      "Use random numbers",
      "Loop until a condition is met",
      "Convert and compare user input",
      "Give helpful feedback to the player",
    ],
    requirements: [
      "Pick a random integer between 1 and 100 when the game starts.",
      "Repeatedly ask the player for a guess until they guess correctly.",
      "After each guess, print 'too high' or 'too low' to guide the player.",
      "When the player guesses correctly, print the number of tries it took.",
      "Quit gracefully if the player types 'quit'.",
    ],
    hints: [
      "Import random and use random.randint(1, 100) to pick the secret number.",
      "Use a while True loop and break when the guess matches.",
      "Keep a counter and add 1 to it after every guess.",
    ],
    milestones: [
      "Pick a secret number with random",
      "Ask the player for a guess",
      "Compare the guess and print too high / too low",
      "Loop until the guess is correct",
      "Report the number of tries at the end",
    ],
    expectedOutput:
      "A playable guessing game:\n\nWelcome! I'm thinking of a number 1-100.\nYour guess: 50\nToo low.\nYour guess: 75\nToo high.\nYour guess: 63\nCorrect! You got it in 3 tries.",
  },
  {
    id: "PY_BASICS_PRJ_CALCULATOR",
    skillId: "PY_BASICS",
    relatedSkillIds: ["PY_BASICS", "CS_BASICS"],
    title: "Command-line Calculator",
    description:
      "Build a calculator that reads an expression like 12 + 8 and prints the result. A classic way to nail input handling, numbers, and control flow.",
    category: "CLI Tool",
    difficulty: "Beginner",
    estimatedMinutes: 60,
    order: 1,
    objectives: [
      "Handle user input",
      "Apply arithmetic and control flow",
      "Structure a small program cleanly",
    ],
    requirements: [
      "Prompt for two numbers and an operator (+ - * /).",
      "Print the computed result.",
      "Handle division by zero with a friendly message.",
      "Reject an unknown operator with a clear error.",
    ],
    hints: [
      "Read input with input() and split it into parts.",
      "Use if / elif to pick the operator.",
      "Convert the operands to floats before computing.",
    ],
    milestones: [
      "Read two numbers from the user",
      "Read an operator",
      "Compute and print the result",
      "Handle division by zero",
      "Reject an unknown operator",
    ],
    expectedOutput:
      "A running calculator:\n\nNumber 1: 12\nNumber 2: 8\nOperator: +\nResult: 20.0",
  },
  {
    id: "JS_PRJ_TODO",
    skillId: "JS",
    relatedSkillIds: ["JS", "HTML_CSS"],
    title: "Todo List",
    description:
      "A browser todo app: add tasks, tick them off, delete them, and keep them between visits using Local Storage.",
    category: "Web App",
    difficulty: "Beginner",
    estimatedMinutes: 90,
    order: 2,
    objectives: [
      "Manipulate the DOM from JavaScript",
      "Handle form events",
      "Persist state with Local Storage",
      "Render a list from an array of items",
    ],
    requirements: [
      "An input box and an 'Add' button to create a task.",
      "Each task shows its text and a delete button.",
      "Clicking a task toggles it as done (styled differently).",
      "Tasks survive a page refresh via Local Storage.",
      "Show how many tasks remain when the page loads.",
    ],
    hints: [
      "Store tasks as an array and re-render the whole list whenever it changes.",
      "Use localStorage.setItem with JSON.stringify to save, and JSON.parse to load.",
      "Attach one event listener to the list and use event delegation for delete buttons.",
    ],
    milestones: [
      "Create the HTML structure and style it",
      "Add a task from the input box",
      "Render the task list from an array",
      "Toggle tasks as done",
      "Delete a task",
      "Persist tasks with Local Storage",
    ],
    expectedOutput:
      "A working todo app:\n\n[input: 'Buy milk'] [Add]\n\n☑ Buy milk\n☐ Write report  [Delete]\n\n2 tasks left",
  },
  {
    id: "JS_PRJ_QUIZ",
    skillId: "JS",
    relatedSkillIds: ["JS", "HTML_CSS"],
    title: "Quiz App",
    description:
      "A single-page quiz that walks through questions one at a time, scores the answers, and shows the result at the end.",
    category: "Web App",
    difficulty: "Beginner",
    estimatedMinutes: 120,
    order: 3,
    objectives: [
      "Model data as an array of objects",
      "Move through questions with state",
      "Collect and compare answers",
      "Render different screens (question / result)",
    ],
    requirements: [
      "Show one question with four answer buttons at a time.",
      "Move to the next question after an answer is chosen.",
      "Track which answers were correct.",
      "Show a final score screen with a 'Restart' button.",
      "At least 5 questions, each with exactly one correct answer.",
    ],
    hints: [
      "Keep questions in an array of { question, options, correctIndex }.",
      "Track the current index and the score in variables.",
      "Re-render based on whether there are more questions left.",
    ],
    milestones: [
      "Define the questions data",
      "Render the first question",
      "Handle selecting an answer",
      "Advance through the questions",
      "Show the final score",
      "Add a restart button",
    ],
    expectedOutput:
      "A working quiz:\n\nQ1 of 5: What does HTML stand for?\n[HyperText Markup Language]\n[High Text Machine Language]\n...\n\nYou scored 4 / 5.",
  },
  {
    id: "JS_PRJ_WEATHER",
    skillId: "JS",
    relatedSkillIds: ["JS", "WEB_BASICS", "HTML_CSS"],
    title: "Weather App",
    description:
      "Fetch the weather for a searched city and show temperature, conditions, and a small forecast.",
    category: "Web App",
    difficulty: "Intermediate",
    estimatedMinutes: 150,
    order: 4,
    objectives: [
      "Call a public API with fetch",
      "Handle async loading and errors",
      "Render dynamic data into the DOM",
      "Style with CSS that adapts to the result",
    ],
    requirements: [
      "A search box to enter a city name.",
      "Fetch live weather from a free public API (e.g. Open-Meteo).",
      "Show the city name, current temperature, and condition.",
      "Show a loading state while the request is in flight.",
      "Show a friendly message when the city is not found.",
    ],
    hints: [
      "Open-Meteo offers a free forecast API that needs no API key.",
      "Use async/await inside a submit handler and try/catch around fetch.",
      "Build the result markup with template strings before inserting it.",
    ],
    milestones: [
      "Set up the search form and result area",
      "Fetch weather data for a city",
      "Render temperature and conditions",
      "Add a loading state",
      "Handle the city-not-found error",
      "Polish the styles",
    ],
    expectedOutput:
      "A weather app:\n\n[city input] [Search]\n\nLondon\n18°C · Partly cloudy\nHumidity 62% · Wind 12 km/h",
  },
  {
    id: "PY_DATA_PRJ_EXPENSE",
    skillId: "PY_DATA",
    relatedSkillIds: ["PY_DATA", "PY_BASICS"],
    title: "Expense Tracker",
    description:
      "A small data-processing program: record expenses from a CSV file, then print totals, averages, and the biggest categories.",
    category: "Data Tool",
    difficulty: "Intermediate",
    estimatedMinutes: 120,
    order: 5,
    objectives: [
      "Read and parse a CSV file",
      "Aggregate numbers with dictionaries",
      "Sort and format results for humans",
    ],
    requirements: [
      "Read a CSV with rows of date,category,amount.",
      "Print the total spent.",
      "Print the average expense.",
      "Print the category with the highest total spend.",
      "Work from a file path given on the command line.",
    ],
    hints: [
      "Use csv.reader from Python's csv module.",
      "Accumulate per-category totals in a dict.",
      "Use max(dict, key=dict.get) to find the biggest category.",
    ],
    milestones: [
      "Read the CSV file",
      "Parse rows into date, category, amount",
      "Compute the total and average",
      "Compute totals per category",
      "Print a clear summary",
    ],
    expectedOutput:
      "An expense summary:\n\nTotal spent: $512.40\nAverage expense: $42.70\nTop category: Food ($183.20)",
  },
  {
    id: "JS_PRJ_API",
    skillId: "JS",
    relatedSkillIds: ["JS", "WEB_BASICS", "CS_BASICS"],
    title: "REST API",
    description:
      "Build a small JSON REST API for managing a list of items with create, read, update, and delete routes.",
    category: "API",
    difficulty: "Advanced",
    estimatedMinutes: 180,
    order: 6,
    objectives: [
      "Route HTTP methods to handlers",
      "Parse JSON request bodies",
      "Return correct status codes",
      "Store data in memory or a simple file",
    ],
    requirements: [
      "GET /items returns the full list.",
      "GET /items/:id returns one item or 404.",
      "POST /items creates an item and returns 201.",
      "DELETE /items/:id removes an item.",
      "Return JSON with proper Content-Type on every response.",
      "Validate that POST includes a title field.",
    ],
    hints: [
      "Node's built-in http module is enough — no framework needed.",
      "Split the URL with new URL(req.url) and inspect the pathname.",
      "Collect the request body in chunks, then JSON.parse it.",
    ],
    milestones: [
      "Start an HTTP server",
      "Implement GET /items",
      "Implement GET /items/:id",
      "Implement POST /items with validation",
      "Implement DELETE /items/:id",
      "Return consistent JSON and status codes",
    ],
    expectedOutput:
      "A working API:\n\ncurl http://localhost:3000/items\n[{\"id\":1,\"title\":\"Learn HTTP\"}]\n\ncurl -X POST http://localhost:3000/items -d '{\"title\":\"Build an API\"}'\n201 {\"id\":2,\"title\":\"Build an API\"}",
  },
  {
    id: "REACT_PRJ_FULLSTACK",
    skillId: "REACT",
    relatedSkillIds: ["REACT", "JS", "HTML_CSS", "WEB_BASICS"],
    title: "Full Stack Application",
    description:
      "A note-taking app with a React front end, a small Node API, and a JSON file acting as the database. Brings everything together.",
    category: "Full Stack",
    difficulty: "Advanced",
    estimatedMinutes: 240,
    order: 7,
    objectives: [
      "Build a component-based UI in React",
      "Fetch data from an API with useEffect",
      "Lift state and pass data through props",
      "Persist data server-side",
    ],
    requirements: [
      "React app that lists notes fetched from the API.",
      "A form to create a new note.",
      "A delete button on each note.",
      "Node API with GET /notes and POST /notes.",
      "Notes survive a server restart (JSON file storage).",
      "Clear separation between client and server folders.",
    ],
    hints: [
      "Run the API on one port and the React dev server on another, using a proxy or full URLs.",
      "Fetch the notes once in useEffect, then update local state after each change.",
      "Write the notes array to a JSON file with fs.writeFileSync after every change.",
    ],
    milestones: [
      "Scaffold the React app",
      "Build the Node API with GET /notes",
      "Wire the list of notes to the UI",
      "Add note creation end to end",
      "Add note deletion",
      "Persist notes to a JSON file",
    ],
    expectedOutput:
      "A working full stack app:\n\n[new note input] [Add]\n\n- Learn React      [Delete]\n- Build an API     [Delete]\n\nRestart the server — your notes are still there.",
  },
];

import type { SkillSeed } from "./types";

/**
 * Roadmap data ported from the legacy Java project (RoadmapData.java).
 * x/y are pixel coordinates used for the skill tree layout, matching the
 * original Swing panel so the tree keeps its familiar shape.
 */
export const skills: SkillSeed[] = [
  {
    id: "CS_BASICS",
    name: "Intro to Computer Science",
    description:
      "Core concepts every programmer needs: how computers represent data, how algorithms work, and how to think about problems computationally.",
    tier: "Core",
    x: 600,
    y: 30,
    objectives: [
      "Explain what computer science is and what programmers do",
      "Describe how computers store and process binary data",
      "Define an algorithm and analyze simple problems step by step",
      "Use flowcharts and pseudocode to plan programs",
    ],
    prereqIds: [],
  },
  {
    id: "C_BASICS",
    name: "C Programming",
    description:
      "Syntax, variables, control flow and functions in C — a low-level language that gives you deep control over the machine.",
    tier: "Core",
    x: 300,
    y: 150,
    objectives: [
      "Write, compile and run a C program",
      "Declare variables using the correct primitive types",
      "Use conditionals and loops to control program flow",
      "Break programs into reusable functions",
    ],
    prereqIds: ["CS_BASICS"],
  },
  {
    id: "C_POINTERS",
    name: "Pointers & Arrays",
    description:
      "Memory addresses, pointer arithmetic and how arrays really work under the hood — the concepts that separate C from most languages.",
    tier: "Advanced",
    x: 150,
    y: 270,
    objectives: [
      "Explain what a pointer is and how addresses relate to variables",
      "Read and write pointer declarations with confidence",
      "Use pointer arithmetic and understand how arrays degrade to pointers",
      "Pass arrays and pointers to functions correctly",
    ],
    prereqIds: ["C_BASICS"],
  },
  {
    id: "C_MEM",
    name: "Memory Management",
    description:
      "Stack vs heap, dynamic allocation with malloc/free, and how to avoid the memory leaks and bugs that crash C programs.",
    tier: "Advanced",
    x: 150,
    y: 390,
    objectives: [
      "Distinguish stack and heap memory",
      "Allocate and free dynamic memory with malloc, calloc and free",
      "Identify and fix memory leaks, dangling pointers and double frees",
      "Use valgrind-style reasoning to debug memory issues",
    ],
    prereqIds: ["C_POINTERS"],
  },
  {
    id: "C_DSA",
    name: "DSA in C",
    description:
      "Linked lists, stacks, queues and trees implemented from scratch in C, with the pointer skills to build them correctly.",
    tier: "Mastery",
    x: 150,
    y: 510,
    objectives: [
      "Implement a singly linked list with insert/delete/search",
      "Build stacks and queues on top of lists",
      "Construct and traverse a binary tree",
      "Analyze the time complexity of the data structures you build",
    ],
    prereqIds: ["C_MEM"],
  },
  {
    id: "WEB_BASICS",
    name: "Web Basics",
    description:
      "How the internet actually works: clients and servers, HTTP requests and responses, DNS, and what happens when you type a URL.",
    tier: "Core",
    x: 900,
    y: 150,
    objectives: [
      "Describe the client–server model of the web",
      "Explain the role of DNS and how a URL is resolved",
      "Understand the HTTP request/response cycle and common status codes",
      "Identify the parts of a web page: HTML, CSS and JavaScript",
    ],
    prereqIds: ["CS_BASICS"],
  },
  {
    id: "HTML_CSS",
    name: "HTML & CSS",
    description:
      "Structure and style web pages with semantic HTML and modern CSS including Flexbox and responsive design.",
    tier: "Frontend",
    x: 800,
    y: 270,
    objectives: [
      "Write semantic HTML for text, links, images, forms and lists",
      "Style elements with CSS selectors, colors and the box model",
      "Build flexible layouts with Flexbox",
      "Make a simple page responsive with media queries",
    ],
    prereqIds: ["WEB_BASICS"],
  },
  {
    id: "JS",
    name: "JavaScript",
    description:
      "The language of the browser: variables, functions, DOM manipulation and modern ES6+ features like arrow functions and destructuring.",
    tier: "Frontend",
    x: 900,
    y: 390,
    objectives: [
      "Write JavaScript variables, functions and events",
      "Manipulate the DOM to update pages dynamically",
      "Use ES6+ features: arrow functions, template strings, destructuring",
      "Handle user input and react to browser events",
    ],
    prereqIds: ["HTML_CSS"],
  },
  {
    id: "REACT",
    name: "React.js",
    description:
      "Build interactive UIs with components, JSX, props and hooks — the foundation of modern front-end development.",
    tier: "Framework",
    x: 900,
    y: 510,
    objectives: [
      "Break a UI into reusable React components",
      "Write JSX that mixes markup and JavaScript",
      "Manage state and side effects with useState and useEffect",
      "Render lists and handle events the React way",
    ],
    prereqIds: ["JS"],
  },
  {
    id: "PY_BASICS",
    name: "Python Basics",
    description:
      "Python's readable syntax, data structures and functions — the fastest path from zero to working code.",
    tier: "Core",
    x: 600,
    y: 150,
    objectives: [
      "Run Python scripts and the interactive interpreter",
      "Use variables, types and operators correctly",
      "Work with lists, dictionaries and loops",
      "Write reusable functions and import modules",
    ],
    prereqIds: ["CS_BASICS"],
  },
  {
    id: "PY_DATA",
    name: "Data Science",
    description:
      "Analyze real data with the Python data stack: Pandas DataFrames, NumPy arrays and Matplotlib visualizations.",
    tier: "Advanced",
    x: 600,
    y: 270,
    objectives: [
      "Load and inspect tabular data with Pandas",
      "Filter, group and summarize DataFrames",
      "Perform vectorized math with NumPy",
      "Create clear charts with Matplotlib",
    ],
    prereqIds: ["PY_BASICS"],
  },
  {
    id: "PY_ML",
    name: "Machine Learning",
    description:
      "Core machine learning concepts and hands-on models with Scikit-learn: training, evaluation and the train/test split.",
    tier: "Mastery",
    x: 600,
    y: 390,
    objectives: [
      "Explain supervised vs unsupervised learning",
      "Prepare features and target labels for a model",
      "Train and evaluate classification models with Scikit-learn",
      "Measure accuracy and avoid overfitting",
    ],
    prereqIds: ["PY_DATA"],
  },
];

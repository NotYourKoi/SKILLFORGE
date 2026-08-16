import type { CourseSeed } from "../types";

/**
 * Starter learning catalog. Courses are built entirely from the existing
 * roadmap skills (id references), so no duplicate content is created. The
 * catalog grows by adding entries here — no UI changes required.
 */
export const courses: CourseSeed[] = [
  {
    id: "PROGRAMMING_FUNDAMENTALS",
    slug: "programming-fundamentals",
    title: "Programming Fundamentals",
    description:
      "Understand how programs really work — from computer-science basics to writing, compiling and debugging C.",
    category: "Programming",
    difficulty: "Beginner",
    estimatedMinutes: 600,
    objectives: [
      "Understand how computers represent and process data",
      "Write, compile and run C programs",
      "Use pointers and manage memory safely",
    ],
    modules: [
      {
        id: "PROGRAMMING_FUNDAMENTALS_M1",
        title: "Computer Science Core",
        description: "The concepts every programmer needs before writing code.",
        order: 0,
        objectives: [
          "Understand how computers store and process binary data",
          "Break problems into algorithms and pseudocode",
        ],
        skillIds: ["CS_BASICS"],
      },
      {
        id: "PROGRAMMING_FUNDAMENTALS_M2",
        title: "Programming in C",
        description: "Syntax, control flow and functions in a low-level language.",
        order: 1,
        objectives: ["Write and compile a C program", "Use variables, loops and functions"],
        skillIds: ["C_BASICS"],
      },
      {
        id: "PROGRAMMING_FUNDAMENTALS_M3",
        title: "Pointers & Memory",
        description: "The concepts that separate C from most other languages.",
        order: 2,
        objectives: ["Read and write pointer declarations", "Manage dynamic memory safely"],
        skillIds: ["C_POINTERS", "C_MEM"],
      },
    ],
  },
  {
    id: "WEB_DEVELOPMENT_FUNDAMENTALS",
    slug: "web-development-fundamentals",
    title: "Web Development Fundamentals",
    description:
      "From how the web works to building interactive interfaces with HTML, CSS, JavaScript and React.",
    category: "Web Development",
    difficulty: "Beginner",
    estimatedMinutes: 600,
    objectives: [
      "Explain how clients, servers, HTTP and DNS work",
      "Build semantic HTML and responsive CSS layouts",
      "Add interactivity with JavaScript and React",
    ],
    modules: [
      {
        id: "WEB_DEVELOPMENT_FUNDAMENTALS_M1",
        title: "How the Web Works",
        description: "The client–server model, DNS and the HTTP request/response cycle.",
        order: 0,
        objectives: ["Describe the client–server model", "Understand URLs, DNS and HTTP"],
        skillIds: ["CS_BASICS", "WEB_BASICS"],
      },
      {
        id: "WEB_DEVELOPMENT_FUNDAMENTALS_M2",
        title: "Frontend Foundations",
        description: "Semantic HTML and modern CSS including Flexbox.",
        order: 1,
        objectives: ["Write semantic HTML", "Style pages with modern CSS"],
        skillIds: ["HTML_CSS"],
      },
      {
        id: "WEB_DEVELOPMENT_FUNDAMENTALS_M3",
        title: "JavaScript",
        description: "The language of the browser: variables, functions and the DOM.",
        order: 2,
        objectives: ["Write JavaScript and manipulate the DOM", "Use modern ES6+ syntax"],
        skillIds: ["JS"],
      },
      {
        id: "WEB_DEVELOPMENT_FUNDAMENTALS_M4",
        title: "React",
        description: "Reusable components, JSX, props and hooks.",
        order: 3,
        objectives: ["Break a UI into components", "Manage state and effects with hooks"],
        skillIds: ["REACT"],
      },
    ],
  },
  {
    id: "COMPUTER_SCIENCE_FUNDAMENTALS",
    slug: "computer-science-fundamentals",
    title: "Computer Science Fundamentals",
    description:
      "The essential CS foundation: thinking computationally, programming in C, and building data structures.",
    category: "Computer Science",
    difficulty: "Beginner",
    estimatedMinutes: 600,
    objectives: [
      "Think about problems computationally",
      "Implement core algorithms in C",
      "Build and analyse data structures",
    ],
    modules: [
      {
        id: "COMPUTER_SCIENCE_FUNDAMENTALS_M1",
        title: "Foundations of Computing",
        description: "Binary data, algorithms and computational thinking.",
        order: 0,
        objectives: ["Explain how computers store data", "Plan programs with flowcharts and pseudocode"],
        skillIds: ["CS_BASICS"],
      },
      {
        id: "COMPUTER_SCIENCE_FUNDAMENTALS_M2",
        title: "Programming in C",
        description: "The language closest to the machine.",
        order: 1,
        objectives: ["Write structured C programs", "Use functions and control flow"],
        skillIds: ["C_BASICS"],
      },
      {
        id: "COMPUTER_SCIENCE_FUNDAMENTALS_M3",
        title: "Data Structures & Algorithms",
        description: "Pointers, memory and classic data structures implemented in C.",
        order: 2,
        objectives: ["Use pointers and dynamic memory", "Implement lists, stacks, queues and trees"],
        skillIds: ["C_POINTERS", "C_MEM", "C_DSA"],
      },
    ],
  },
  {
    id: "PYTHON_FUNDAMENTALS",
    slug: "python-fundamentals",
    title: "Python Fundamentals",
    description:
      "Start from zero and build real Python skills — the fastest path from nothing to working code.",
    category: "Programming",
    difficulty: "Beginner",
    estimatedMinutes: 300,
    objectives: [
      "Write and run Python programs",
      "Use variables, types and control flow confidently",
      "Work with lists, dictionaries and functions",
    ],
    modules: [
      {
        id: "PYTHON_FUNDAMENTALS_M1",
        title: "Programming Foundations",
        description: "Core computer-science concepts before your first Python script.",
        order: 0,
        objectives: ["Understand how programs execute", "Learn to think computationally"],
        skillIds: ["CS_BASICS"],
      },
      {
        id: "PYTHON_FUNDAMENTALS_M2",
        title: "Python Basics",
        description: "Python's readable syntax, data structures and functions.",
        order: 1,
        objectives: ["Write correct Python syntax", "Use functions and core data structures"],
        skillIds: ["PY_BASICS"],
      },
    ],
  },
  {
    id: "DATA_STRUCTURES_ALGORITHMS",
    slug: "data-structures-and-algorithms",
    title: "Data Structures & Algorithms",
    description:
      "Master the data structures and algorithms behind every technical interview, implemented from scratch in C.",
    category: "Computer Science",
    difficulty: "Intermediate",
    estimatedMinutes: 600,
    objectives: [
      "Implement linked lists, stacks, queues and trees",
      "Manage memory correctly while building them",
      "Analyse time complexity",
    ],
    modules: [
      {
        id: "DATA_STRUCTURES_ALGORITHMS_M1",
        title: "Prerequisites",
        description: "The skills you need before tackling data structures.",
        order: 0,
        objectives: ["Write structured C programs", "Reason about algorithms"],
        skillIds: ["CS_BASICS", "C_BASICS"],
      },
      {
        id: "DATA_STRUCTURES_ALGORITHMS_M2",
        title: "Pointers & Memory",
        description: "Memory management is the foundation of data structures in C.",
        order: 1,
        objectives: ["Master pointer arithmetic", "Allocate and free memory safely"],
        skillIds: ["C_POINTERS", "C_MEM"],
      },
      {
        id: "DATA_STRUCTURES_ALGORITHMS_M3",
        title: "Core Data Structures",
        description: "Classic data structures built by hand.",
        order: 2,
        objectives: ["Implement lists, stacks and queues", "Build and traverse binary trees"],
        skillIds: ["C_DSA"],
      },
    ],
  },
  {
    id: "AI_ML_FUNDAMENTALS",
    slug: "ai-machine-learning-fundamentals",
    title: "AI / Machine Learning Fundamentals",
    description:
      "Understand how machines learn — from analysing data with Python to training and evaluating models.",
    category: "AI",
    difficulty: "Intermediate",
    estimatedMinutes: 600,
    objectives: [
      "Explain core machine-learning concepts",
      "Analyse data with the Python data stack",
      "Train and evaluate ML models with Scikit-learn",
    ],
    modules: [
      {
        id: "AI_ML_FUNDAMENTALS_M1",
        title: "Foundations",
        description: "The programming and CS basics you need before machine learning.",
        order: 0,
        objectives: ["Think computationally", "Write Python programs"],
        skillIds: ["CS_BASICS", "PY_BASICS"],
      },
      {
        id: "AI_ML_FUNDAMENTALS_M2",
        title: "Data Analysis",
        description: "Pandas, NumPy and Matplotlib — the Python data stack.",
        order: 1,
        objectives: ["Load and inspect data with Pandas", "Create clear visualizations"],
        skillIds: ["PY_DATA"],
      },
      {
        id: "AI_ML_FUNDAMENTALS_M3",
        title: "Machine Learning",
        description: "Training, evaluating and avoiding overfitting.",
        order: 2,
        objectives: ["Explain supervised vs unsupervised learning", "Train classification models"],
        skillIds: ["PY_ML"],
      },
    ],
  },
];

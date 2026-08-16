import type { LessonSeed } from "../types";

export const webLessons: LessonSeed[] = [
  {
    skillId: "HTML_CSS",
    title: "HTML Structure & Semantics",
    description:
      "Writing the skeleton every page shares, and choosing semantic tags that help search engines and screen readers.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Write a valid HTML document skeleton
- Use semantic tags for text, links, images and lists
- Understand elements, tags and attributes

## Explanation

**HTML** (HyperText Markup Language) describes the *structure and meaning* of a page. A tag like \`<h1>\` marks a top-level heading; the browser decides how it looks. You should prefer **semantic** tags — tags that describe meaning — over generic ones, because they help search engines and screen readers.

The skeleton every page shares:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
</head>
<body>
  <!-- content goes here -->
</body>
</html>
\`\`\`

Key elements:

- \`<h1>\` to \`<h6>\` — headings by importance.
- \`<p>\` — paragraph.
- \`<a href="...">\` — link.
- \`<img src="..." alt="...">\` — image; \`alt\` text matters for accessibility.
- \`<ul>\`/\`<ol>\` with \`<li>\` — unordered / ordered lists.
- \`<nav>\`, \`<header>\`, \`<main>\`, \`<section>\`, \`<footer>\` — semantic regions.
- \`<form>\`, \`<input>\`, \`<button>\` — user input.

## Summary

HTML gives structure and meaning. Use semantic tags, always set \`alt\` on images, and keep the skeleton consistent. Structure first — appearance comes next with CSS.`,
    checkpoints: [
      {
        question: "Which tag should you use for a top-level heading?",
        options: ["<head>", "<h1>", "<title>", "<header>"],
        correctIndex: 1,
        explanation:
          "<h1> marks the most important heading on the page. <title> sets the browser tab text, <header> is a semantic region, and <head> holds metadata.",
      },
    ],
  },
  {
    skillId: "HTML_CSS",
    title: "CSS Styling & the Box Model",
    description:
      "Selectors, properties, and the box model — content, padding, border and margin — that explains most layout surprises.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Apply CSS with selectors and properties
- Explain the box model: content, padding, border, margin
- Use colors, fonts and spacing effectively

## Explanation

**CSS** (Cascading Style Sheets) controls how HTML looks. A rule targets elements with a **selector** and sets **properties**:

\`\`\`css
/* element selector */
h1 { color: #1e293b; }

/* class selector */
.card { border: 1px solid #e2e8f0; padding: 16px; }

/* id selector */
#main { max-width: 800px; margin: 0 auto; }
\`\`\`

Every element is a **box** with four layers, from the inside out:

\`\`\`text
+-------------------------------------+
| margin      (space outside)         |
|  +-------------------------------+  |
|  | border      (visible edge)    |  |
|  |  +-------------------------+  |  |
|  |  | padding  (inner space)  |  |  |
|  |  |  +-------------------+  |  |  |
|  |  |  | content (text)    |  |  |  |
|  |  |  +-------------------+  |  |  |
|  |  +-------------------------+  |  |
|  +-------------------------------+  |
+-------------------------------------+
\`\`\`

\`box-sizing: border-box\` makes width include padding and border, which is almost always what you want:

\`\`\`css
* { box-sizing: border-box; }
\`\`\`

Link your stylesheet in the head with \`<link rel="stylesheet" href="styles.css">\`.

## Summary

CSS selects elements and styles their boxes. Learn the box model cold — content, padding, border, margin — and use \`border-box\`. That mental model explains most layout surprises.`,
    checkpoints: [
      {
        question: "Which layer of the box model sits between the content and the border?",
        options: ["margin", "padding", "outline", "gap"],
        correctIndex: 1,
        explanation:
          "From the inside out the layers are: content, padding, border, margin. Padding is inner space between content and border.",
      },
    ],
  },
  {
    skillId: "HTML_CSS",
    title: "Layouts with Flexbox",
    description:
      "Arranging containers and their children along rows and columns with justify-content, align-items and wrap.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Turn a container into a flex layout
- Align and distribute items with justify-content and align-items
- Build a responsive card row

## Explanation

**Flexbox** arranges a container's children along a row or column. Set \`display: flex\` on the parent; the children become flex items.

The two main axes:
- **Main axis** — the direction items flow (row by default).
- **Cross axis** — perpendicular to it.

Control distribution along the main axis with \`justify-content\`; along the cross axis with \`align-items\`.

\`\`\`css
.nav {
  display: flex;
  justify-content: space-between; /* spread items out */
  align-items: center;            /* center vertically */
}
\`\`\`

A responsive card grid:

\`\`\`css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.card {
  flex: 1 1 220px;  /* grow, shrink, basis */
  min-width: 0;
}
\`\`\`

With \`flex-wrap: wrap\` and a flex basis, cards flow onto new lines as the screen narrows — responsive with very little code. The mobile-first approach adds media queries only when you need a layout *change*, not for simple reflow.

## Summary

Flexbox lays out children along one axis. Master \`justify-content\`, \`align-items\`, \`flex-wrap\` and \`gap\`, and you can build headers, navbars and card grids — the backbone of most modern layouts.`,
    checkpoints: [
      {
        question: "Which property controls how items are spread along the main axis?",
        options: ["align-items", "justify-content", "flex-direction", "gap"],
        correctIndex: 1,
        explanation:
          "justify-content distributes items along the main axis; align-items handles the cross axis. flex-direction changes which axis is the main one.",
      },
    ],
  },
  {
    skillId: "JS",
    title: "JavaScript Fundamentals",
    description:
      "Variables, arrow functions, and the map/filter/reduce trio that powers most modern JavaScript.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Declare variables with let, const and understand scope
- Use functions, including arrow functions
- Work with arrays and objects
- Understand events in the browser

## Explanation

**JavaScript** is the programming language of the browser. It runs in the page and can change the DOM, respond to clicks, and fetch data.

Variables:

\`\`\`js
const name = "Aria";      // cannot be reassigned (prefer this)
let score = 0;            // can be reassigned
score = score + 10;

const scores = [90, 85, 95];       // array
const user = { name: "Aria", age: 21 };  // object
\`\`\`

Functions — the modern arrow form:

\`\`\`js
const add = (a, b) => a + b;

function greet(name) {
  return "Hello, " + name;
}
\`\`\`

Array methods do the heavy lifting:

\`\`\`js
const nums = [1, 2, 3, 4];
const doubled = nums.map((n) => n * 2);   // [2, 4, 6, 8]
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]
const total = nums.reduce((sum, n) => sum + n, 0); // 10
\`\`\`

## Summary

JavaScript runs in the browser and brings pages to life. Learn \`const\`/\`let\`, arrow functions, objects/arrays and the big three array methods (\`map\`, \`filter\`, \`reduce\`) — you will use them every day.`,
    checkpoints: [
      {
        question: "What does nums.filter(n => n > 10) return for nums = [5, 12, 8, 20]?",
        options: ["[12, 20]", "[5, 8]", "[12, 8, 20]", "[5, 12, 20]"],
        correctIndex: 0,
        explanation:
          "filter keeps only the elements for which the callback returns true. Only 12 and 20 are greater than 10.",
      },
    ],
  },
  {
    skillId: "JS",
    title: "The DOM & Events",
    description:
      "Reading and changing the browser's live page tree, and wiring up clicks, input and other events.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Select and modify DOM elements
- Create and remove elements dynamically
- Listen to events like clicks and input

## Explanation

The **DOM** (Document Object Model) is the browser's live tree of the page. JavaScript changes the page by changing this tree.

Select an element and read or write its content:

\`\`\`js
const title = document.querySelector("#title");
title.textContent = "New heading";
title.style.color = "red";
\`\`\`

Create and append elements:

\`\`\`js
const li = document.createElement("li");
li.textContent = "Pointers";
document.querySelector("#list").appendChild(li);
\`\`\`

Events: the browser fires them (click, input, keydown), and you attach handlers with \`addEventListener\`:

\`\`\`js
const btn = document.querySelector("#submit");
btn.addEventListener("click", (event) => {
  event.preventDefault();            // stop form submission
  const input = document.querySelector("#name").value;
  console.log("Hello, " + input);
});
\`\`\`

Put the script tag at the end of \`<body>\` or use \`defer\` so the DOM exists before your code runs.

## Summary

The DOM is your window into the page. Query elements, change them, create new ones, and wire up events. With those three skills you can make any static page interactive.`,
    checkpoints: [
      {
        question: "Which method finds the first element matching a CSS selector?",
        options: [
          "document.querySelector",
          "document.getElementByIds",
          "document.createSelector",
          "document.append",
        ],
        correctIndex: 0,
        explanation:
          "document.querySelector('#title') returns the first element matching the selector. createElement creates new nodes and appendChild adds them.",
      },
    ],
  },
  {
    skillId: "JS",
    title: "Modern ES6+ Features",
    description:
      "Template literals, destructuring, spread/rest and async/await — the idioms every modern codebase uses.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Use template literals and string interpolation
- Destructure objects and arrays
- Use spread/rest and default parameters
- Understand async/await for promises

## Explanation

Modern JavaScript (ES6+) added syntax that makes code shorter and clearer.

Template literals — backtick strings with interpolation:

\`\`\`js
const name = "Kael";
const greeting = \`Welcome, \${name}!\`;
// => "Welcome, Kael!"
\`\`\`

Destructuring pulls values out of objects and arrays:

\`\`\`js
const user = { id: 7, role: "admin", name: "Kael" };
const { id, role } = user;            // id = 7, role = "admin"

const [first, second, ...rest] = [1, 2, 3, 4];
// first = 1, second = 2, rest = [3, 4]
\`\`\`

Default parameters and spread:

\`\`\`js
const greet = (name = "friend") => \`Hi \${name}\`;
greet();             // "Hi friend"

const nums = [1, 2];
const more = [...nums, 3];           // [1, 2, 3]
const merged = { ...user, active: true };
\`\`\`

Async/await reads like synchronous code while handling promises:

\`\`\`js
async function loadUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error("failed to load");
  return res.json();
}
\`\`\`

## Summary

ES6+ gives you template literals, destructuring, spread and async/await. Together they cut boilerplate dramatically and are the idioms used in every modern codebase, including this app.`,
    checkpoints: [
      {
        question: "After `const [a, ...rest] = [1, 2, 3, 4]`, what is rest?",
        options: ["[2, 3, 4]", "2", "[3, 4]", "undefined"],
        correctIndex: 0,
        explanation:
          "Rest parameters collect the remaining items into a new array. a takes 1 and rest becomes [2, 3, 4].",
      },
    ],
  },
  {
    skillId: "REACT",
    title: "Components & JSX",
    description:
      "Breaking a UI into reusable functions that return JSX, and passing data between them with props.",
    estimatedMinutes: 10,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Break a UI into components
- Write JSX that mixes markup with JavaScript
- Pass data with props
- Compose small components into larger ones

## Explanation

**React** builds UIs from **components** — functions that return what should be rendered. A component is a function returning JSX, and you compose them like LEGO bricks.

\`\`\`jsx
function SkillCard({ name, tier }) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <span>{tier}</span>
    </div>
  );
}

function App() {
  return (
    <main>
      <SkillCard name="Pointers" tier="Advanced" />
      <SkillCard name="React" tier="Framework" />
    </main>
  );
}
\`\`\`

**JSX** looks like HTML but is JavaScript: you embed values with \`{...}\`, and \`className\` replaces \`class\`. One component, one clear job — that is the rule that keeps large apps maintainable.

## Summary

Components are functions that return JSX and receive data through props. Small, focused components composed together scale far better than giant markup files.`,
    checkpoints: [
      {
        question: "How does a parent component pass data to a child component?",
        options: ["Via props", "Via CSS classes", "Via global variables", "Via the DOM"],
        correctIndex: 0,
        explanation:
          "Components receive data through props — attributes written like <SkillCard name=\"Pointers\" /> are passed into the component's props object.",
      },
    ],
  },
  {
    skillId: "REACT",
    title: "State & Hooks",
    description:
      "Making UIs dynamic with useState, handling side effects with useEffect, and the re-render mental model.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Manage dynamic values with useState
- Run effects with useEffect
- Explain why state changes re-render components

## Explanation

Static components are boring — **state** is what makes UIs dynamic. \`useState\` declares a piece of state and returns the current value plus a setter. When the setter is called, React re-renders the component with the new value.

\`\`\`jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

\`useEffect\` runs code after rendering — the place for fetching data, subscriptions or timers:

\`\`\`jsx
import { useEffect, useState } from "react";

function SkillProgress({ skillId }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetch(\`/api/skills/\${skillId}\`)
      .then((res) => res.json())
      .then((data) => setProgress(data.progress));
  }, [skillId]); // re-run only when skillId changes

  return <div>Progress: {progress}%</div>;
}
\`\`\`

Rules to respect:
- Only call hooks at the top level of a component.
- The dependency array controls when an effect re-runs.

## Summary

\`useState\` stores dynamic values; \`useEffect\` handles side effects. State changes trigger re-renders, which is the core React mental model.`,
    checkpoints: [
      {
        question: "What happens when you call the setter returned by useState?",
        options: [
          "React re-renders the component with the new value",
          "The page reloads",
          "The DOM is replaced entirely",
          "Nothing until you call render()",
        ],
        correctIndex: 0,
        explanation:
          "Calling the setter updates the state value and schedules a re-render of that component with the new value — that is how React UIs stay dynamic.",
      },
    ],
  },
  {
    skillId: "REACT",
    title: "Lists, Events & Forms",
    description:
      "Rendering lists with keys, handling events, and building controlled form inputs where React owns the value.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Render lists with keys
- Handle events in React
- Build controlled form inputs

## Explanation

Render a list by mapping it to elements. The \`key\` prop lets React track items across re-renders — use a stable unique value, never the array index.

\`\`\`jsx
const skills = [
  { id: "C_MEM", name: "Memory Management" },
  { id: "JS", name: "JavaScript" },
];

function SkillList() {
  return (
    <ul>
      {skills.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
\`\`\`

**Controlled inputs** keep the input's value in React state, so the form and your data stay in sync:

\`\`\`jsx
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Logging in", email, password);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log in</button>
    </form>
  );
}
\`\`\`

Event handlers receive the event; forms call \`preventDefault()\` to stop the page reloading.

## Summary

Lists, events and controlled forms are the bread and butter of React apps. Map with keys, handle events with functions, and let React state own your inputs.`,
    checkpoints: [
      {
        question: "What should you pass as the key when rendering a list?",
        options: [
          "The array index",
          "A stable unique value like an id",
          "The component name",
          "A random number",
        ],
        correctIndex: 1,
        explanation:
          "Use a stable unique value such as an id. The array index is discouraged because it breaks item tracking when the list changes order or length.",
      },
    ],
  },
];

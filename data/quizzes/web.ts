import type { QuizSeed } from "../types";

export const webQuizzes: QuizSeed[] = [
  {
    skillId: "HTML_CSS",
    title: "HTML & CSS Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which tag is the correct semantic choice for a top-level heading?",
        explanation: "<h1> is the top-level heading, representing the page's primary content heading.",
        options: [
          { text: "<h1>", correct: true },
          { text: "<strong>", correct: false },
          { text: "<p>", correct: false },
          { text: "<div>", correct: false },
        ],
      },
      {
        prompt: "What are the four layers of the CSS box model, inside to outside?",
        explanation: "Content is the innermost layer, then padding, border, and margin.",
        options: [
          { text: "content, padding, border, margin", correct: true },
          { text: "content, margin, border, padding", correct: false },
          { text: "padding, content, border, margin", correct: false },
          { text: "margin, border, padding, content", correct: false },
        ],
      },
      {
        prompt: "What does box-sizing: border-box do?",
        explanation: "It makes an element's width include padding and border, keeping sizing predictable.",
        options: [
          { text: "Includes padding and border in the element's width", correct: true },
          { text: "Adds a visible border to every box", correct: false },
          { text: "Removes padding from all elements", correct: false },
          { text: "Centers the box horizontally", correct: false },
        ],
      },
      {
        prompt: "In flexbox, what does justify-content: space-between do?",
        explanation: "It distributes items along the main axis with equal space between them and none at the ends.",
        options: [
          { text: "Spreads items with equal space between them on the main axis", correct: true },
          { text: "Centers items on the cross axis", correct: false },
          { text: "Wraps items onto new lines", correct: false },
          { text: "Sets a fixed gap between items", correct: false },
        ],
      },
      {
        prompt: "Why is the alt attribute important on images?",
        explanation: "alt provides a text alternative for screen readers and when the image fails to load.",
        options: [
          { text: "It provides a text alternative for accessibility and failures", correct: true },
          { text: "It is required for the image to display", correct: false },
          { text: "It tells the browser how to resize the image", correct: false },
          { text: "It makes the image load faster", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "JS",
    title: "JavaScript Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which of these declares a variable that cannot be reassigned?",
        explanation: "const declares a binding that cannot be reassigned; let allows reassignment.",
        options: [
          { text: "const score = 10;", correct: true },
          { text: "let score = 10;", correct: false },
          { text: "var score = 10;", correct: false },
          { text: "static score = 10;", correct: false },
        ],
      },
      {
        prompt: "What does [1, 2, 3].map(n => n * 2) return?",
        explanation: "map transforms each element by the callback, producing [2, 4, 6].",
        options: [
          { text: "[2, 4, 6]", correct: true },
          { text: "[1, 2, 3]", correct: false },
          { text: "6", correct: false },
          { text: "[1, 4, 9]", correct: false },
        ],
      },
      {
        prompt: "How do you select an element by id from the DOM?",
        explanation: "document.querySelector('#id') selects by CSS selector; getElementById works too.",
        options: [
          { text: "document.querySelector('#title')", correct: true },
          { text: "document.createElement('title')", correct: false },
          { text: "document.title()", correct: false },
          { text: "document.append('#title')", correct: false },
        ],
      },
      {
        prompt: "What is the result of `Hi ${'a'.toUpperCase()}`?",
        explanation: "The template literal interpolates the expression 'a'.toUpperCase(), which is 'A'.",
        options: [
          { text: "'Hi A'", correct: true },
          { text: "'HI A'", correct: false },
          { text: "'Hi a'", correct: false },
          { text: "'Hi ${A}'", correct: false },
        ],
      },
      {
        prompt: "Which statement correctly describes async/await?",
        explanation: "await pauses a function until a promise settles, letting asynchronous code read like sync code.",
        options: [
          { text: "await pauses until a promise settles, reading like sync code", correct: true },
          { text: "await makes a function run in a separate thread", correct: false },
          { text: "await is only allowed in event handlers", correct: false },
          { text: "await converts sync code into a promise", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "REACT",
    title: "React Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "What is a React component?",
        explanation: "A component is a function (or class) that returns JSX describing what should be rendered.",
        options: [
          { text: "A function that returns JSX", correct: true },
          { text: "An HTML file", correct: false },
          { text: "A CSS class", correct: false },
          { text: "A JavaScript variable", correct: false },
        ],
      },
      {
        prompt: "How do you pass data into a component?",
        explanation: "Data is passed as props — properties supplied at the JSX call site.",
        options: [
          { text: "Via props in JSX, like <Card name=\"x\" />", correct: true },
          { text: "Via global variables", correct: false },
          { text: "Via CSS classes", correct: false },
          { text: "Via the URL hash", correct: false },
        ],
      },
      {
        prompt: "Which hook holds a component's dynamic value?",
        explanation: "useState returns the current value and a setter that triggers a re-render.",
        options: [
          { text: "useState", correct: true },
          { text: "useEffect", correct: false },
          { text: "useCallback", correct: false },
          { text: "useRef", correct: false },
        ],
      },
      {
        prompt: "Why must list items have a unique key prop?",
        explanation: "Keys let React track which items changed across re-renders, enabling efficient updates.",
        options: [
          { text: "So React can track items efficiently across re-renders", correct: true },
          { text: "So the items are styled differently", correct: false },
          { text: "So the items are sorted automatically", correct: false },
          { text: "So the list is clickable", correct: false },
        ],
      },
      {
        prompt: "What is a controlled input?",
        explanation: "The input's value is owned by React state, keeping the DOM and state in sync.",
        options: [
          { text: "An input whose value is controlled by React state", correct: true },
          { text: "An input with a required attribute", correct: false },
          { text: "An input inside a form tag", correct: false },
          { text: "An input that disables itself", correct: false },
        ],
      },
    ],
  },
];

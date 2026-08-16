import type { QuizSeed } from "../types";

export const csQuizzes: QuizSeed[] = [
  {
    skillId: "CS_BASICS",
    title: "Computer Science Fundamentals Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which of these is the correct order of the levels of abstraction in a modern computer?",
        explanation: "Hardware is the physical foundation; the OS sits on it; applications run on the OS; the user interacts with applications.",
        options: [
          { text: "Hardware → Operating System → Applications → User", correct: true },
          { text: "Applications → Hardware → Operating System → User", correct: false },
          { text: "Operating System → Hardware → Applications → User", correct: false },
          { text: "User → Applications → Hardware → Operating System", correct: false },
        ],
      },
      {
        prompt: "What is the binary representation of the decimal number 5?",
        explanation: "5 = 4 + 1 = 1×2² + 0×2¹ + 1×2⁰, which is 101.",
        options: [
          { text: "101", correct: true },
          { text: "110", correct: false },
          { text: "100", correct: false },
          { text: "111", correct: false },
        ],
      },
      {
        prompt: "What does RAM stand for, and what is its role?",
        explanation: "RAM is Random Access Memory — fast, volatile working memory the CPU uses while a program runs.",
        options: [
          { text: "Random Access Memory; fast volatile working memory", correct: true },
          { text: "Read-All Memory; permanent storage of files", correct: false },
          { text: "Rapid Arithmetic Module; the main processor", correct: false },
          { text: "Read Access Memory; offline archival storage", correct: false },
        ],
      },
      {
        prompt: "What is a compiler?",
        explanation: "A compiler translates a whole source file into machine code before execution.",
        options: [
          { text: "A program that translates source code into machine code before running", correct: true },
          { text: "A program that runs source code line by line without translation", correct: false },
          { text: "A tool that only checks for syntax errors", correct: false },
          { text: "A hardware device that stores compiled programs", correct: false },
        ],
      },
      {
        prompt: "Which of these is a good example of a foundational CS concept applied everywhere?",
        explanation: "Abstraction — hiding complexity behind simple interfaces — is the idea behind everything from functions to operating systems.",
        options: [
          { text: "Abstraction, e.g. an API hiding a complex system", correct: true },
          { text: "Spelling each command out character by character", correct: false },
          { text: "Memorizing every library's source code", correct: false },
          { text: "Avoiding reuse so programs stay simple", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "WEB_BASICS",
    title: "How the Web Works Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which protocol do web browsers and servers use to exchange pages?",
        explanation: "HTTP (HyperText Transfer Protocol) is the request/response protocol of the web; HTTPS is its encrypted form.",
        options: [
          { text: "HTTP / HTTPS", correct: true },
          { text: "SMTP", correct: false },
          { text: "FTP", correct: false },
          { text: "SSH", correct: false },
        ],
      },
      {
        prompt: "What does a browser send to a server when you visit a URL?",
        explanation: "The browser sends an HTTP request (method, path, headers, body) and the server replies with a response.",
        options: [
          { text: "An HTTP request; the server replies with an HTTP response", correct: true },
          { text: "A file download; the server stores it", correct: false },
          { text: "A compiled binary; the server executes it", correct: false },
          { text: "Nothing; the server broadcasts the page to everyone", correct: false },
        ],
      },
      {
        prompt: "What does DNS do?",
        explanation: "DNS (Domain Name System) translates human-readable names like example.com into IP addresses.",
        options: [
          { text: "Translates domain names into IP addresses", correct: true },
          { text: "Encrypts traffic between browser and server", correct: false },
          { text: "Stores web page content for offline use", correct: false },
          { text: "Load-balances requests across servers", correct: false },
        ],
      },
      {
        prompt: "Which HTTP status code means 'not found'?",
        explanation: "404 Not Found means the requested resource does not exist.",
        options: [
          { text: "404", correct: true },
          { text: "200", correct: false },
          { text: "500", correct: false },
          { text: "301", correct: false },
        ],
      },
    ],
  },
];

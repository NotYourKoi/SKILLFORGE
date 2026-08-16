import type { LessonSeed } from "../types";

export const csLessons: LessonSeed[] = [
  {
    skillId: "CS_BASICS",
    title: "What is Computer Science?",
    description:
      "What computer science really is: solving problems with computation, and the four pillars of computational thinking.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Explain what computer science is and what programmers actually do
- Distinguish computer science from simply "using computers"
- Understand why problem solving matters more than memorizing syntax

## Explanation

Computer science is the study of **problems and how to solve them with computation**. A computer is just a very fast, very literal machine: it only does exactly what it is told. The real skill is figuring out *what* to tell it.

When you write a program, you are translating a problem from the real world into precise, step-by-step instructions the machine can follow. That process — breaking a big problem into small, unambiguous steps — is called **computational thinking**.

Four ideas show up constantly:

1. **Decomposition** — split a large problem into smaller, manageable parts.
2. **Pattern recognition** — notice that new problems look like ones you have solved before.
3. **Abstraction** — ignore irrelevant details and focus on what matters.
4. **Algorithmic thinking** — write down a clear sequence of steps.

## Examples

Imagine you want to "make a sandwich". To a human, that is one idea. To a computer, it is nothing — you must be explicit:

\`\`\`text
1. Fetch two slices of bread.
2. Open the jar of peanut butter.
3. Spread peanut butter on one slice.
4. Place the other slice on top.
5. Serve.
\`\`\`

This is a tiny **algorithm**. Notice how each step is a single, exact action. Programming languages let you express such steps so precisely that a computer can execute them.

:::note
You don't need a computer to practice algorithmic thinking — writing down the exact steps to make a sandwich is real practice.
:::

## Key Concepts
- **Program**: a precise list of instructions for a computer.
- **Algorithm**: a step-by-step procedure for solving a problem.
- **Computational thinking**: decomposition, pattern recognition, abstraction, algorithmic thinking.
- **Syntax**: the grammar rules of a programming language (like spelling in English).

## Summary

Computer science is not about memorizing code. It is about learning to think precisely, decompose problems, and express solutions as clear algorithms. Every language you will learn in this roadmap — C, JavaScript, Python — is just a different vocabulary for the same fundamental ideas.`,
    checkpoints: [
      {
        question: "Which computational thinking idea means 'splitting a large problem into smaller parts'?",
        options: ["Abstraction", "Decomposition", "Pattern recognition", "Algorithmic thinking"],
        correctIndex: 1,
        explanation:
          "Decomposition splits a large problem into smaller, manageable parts. Abstraction ignores irrelevant details, pattern recognition finds similarities with past problems, and algorithmic thinking writes clear step-by-step sequences.",
      },
    ],
  },
  {
    skillId: "CS_BASICS",
    title: "How Computers Represent Data",
    description:
      "How every piece of data — text, images and sound — reduces to binary numbers, and why computers only understand 0s and 1s.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Explain binary and why computers use it
- Convert small numbers between decimal and binary
- Describe how text, images and sound are stored as numbers
- Understand bits and bytes as units of storage

## Explanation

Inside a computer, everything is stored as **binary**: a long sequence of ones and zeroes. Why? Because the hardware can only reliably distinguish two states — a switch that is ON (1) or OFF (0). Groups of these states represent everything else.

A single 0 or 1 is a **bit**. Eight bits make a **byte**, which can represent 256 different values (2^8). That is enough for one character of text, one shade of color, or one small number.

Numbers work the same way they do in decimal, but with base 2 instead of base 10:

\`\`\`text
Decimal 13 = (1 * 8) + (1 * 4) + (0 * 2) + (1 * 1) = 1101 in binary
\`\`\`

Text is mapped to numbers using a standard like **ASCII** or **Unicode** — every letter becomes a number. Images are grids of pixels, each pixel a set of numbers (red, green, blue). Sound is a series of samples, each sample a number. So one rule covers everything:

> Everything in a computer is a number, and every number is stored in binary.

## Examples

Converting 5 to binary — repeatedly divide by 2 and record the remainders:

\`\`\`text
5 / 2 = 2 remainder 1
2 / 2 = 1 remainder 0
1 / 2 = 0 remainder 1
Read remainders bottom-up: 101  (so decimal 5 = binary 101)
\`\`\`

Sizes you will meet constantly:

\`\`\`text
1 byte    = 8 bits   -> 256 values
1 kilobyte = 1024 bytes
1 megabyte = 1024 kilobytes
1 gigabyte = 1024 megabytes
\`\`\`

:::warning
Don't assume metric prefixes: in most programming contexts a kilobyte is 1024 bytes, not 1000. Storage vendors sometimes use 1000, which is why "1 TB" drives show less space than expected.
:::

## Key Concepts
- **Bit**: one binary digit, 0 or 1.
- **Byte**: 8 bits, the basic unit of storage.
- **Binary**: base-2 number system used by all computers.
- **ASCII/Unicode**: standards that map characters to numbers.
- **Pixel**: a picture element whose color is stored as numbers.

## Summary

Computers only understand two values: 0 and 1. Bits combine into bytes, bytes encode numbers, and numbers encode everything else — text, images, sound, programs. Understanding binary makes later topics like data types and memory much easier to grasp.`,
    checkpoints: [
      {
        question: "How many different values can one byte represent?",
        options: ["8", "128", "256", "1024"],
        correctIndex: 2,
        explanation:
          "A byte is 8 bits, and 2^8 = 256. Eight bits can represent any value from 0 to 255, which is enough for one character of text.",
      },
    ],
  },
  {
    skillId: "CS_BASICS",
    title: "Algorithms & Problem Solving",
    description:
      "Turning problems into precise, finite, effective steps — and judging how good an algorithm is with Big-O notation.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Define an algorithm precisely
- Express solutions using pseudocode and flowcharts
- Evaluate whether one algorithm is better than another
- Practice decomposition on a real problem

## Explanation

An **algorithm** is a finite sequence of unambiguous steps that turns an input into an output. It must be:
- **Precise** — no ambiguity, every step is clear.
- **Finite** — it ends after a bounded number of steps.
- **Effective** — each step is actually doable.

When you solve a problem, do not reach for code immediately. First express the solution in **pseudocode** — plain language that looks a bit like code. This forces you to think about the logic before fighting with syntax.

Programmers compare algorithms using **time complexity**, written in **Big-O notation**. It describes how the work grows as the input grows. For example, searching a sorted list by checking every item is O(n); halving the search space each time (binary search) is O(log n). For large inputs, that difference is enormous.

## Examples

Pseudocode for finding the largest number in a list:

\`\`\`text
largest = first element of list
for each remaining element e:
    if e > largest:
        largest = e
return largest
\`\`\`

It examines every element exactly once, so it runs in O(n) time. There is no faster way to find a maximum without extra information — which is exactly the kind of insight Big-O gives you.

Now decompose a bigger problem, "validate a login form":

\`\`\`text
1. Read email and password
2. If email is empty or has no "@" -> show error, stop
3. If password is shorter than 8 characters -> show error, stop
4. Look up user by email
5. If user not found -> show "invalid credentials", stop
6. Compare hashed password
7. If mismatch -> show "invalid credentials", stop
8. Create session and redirect to dashboard
\`\`\`

## Key Concepts
- **Algorithm**: precise, finite, effective steps.
- **Pseudocode**: logic written in plain, code-like language.
- **Big-O**: how runtime scales with input size.
- **Decomposition**: splitting a problem into smaller sub-problems.

## Summary

Before writing code, write the algorithm. Express it in pseudocode, then evaluate its complexity with Big-O. This habit — thinking first, coding second — is the single biggest difference between beginners and experienced programmers.`,
    checkpoints: [
      {
        question: "Which of the following is NOT a requirement for an algorithm?",
        options: ["Precise", "Finite", "Effective", "Fast on every machine"],
        correctIndex: 3,
        explanation:
          "An algorithm must be precise, finite and effective. Being fast is about performance (Big-O), not a requirement for something to count as an algorithm.",
      },
    ],
  },
  {
    skillId: "WEB_BASICS",
    title: "Clients, Servers & the Internet",
    description:
      "The client–server model: how browsers, web servers and databases work together to deliver the pages you see.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Explain the client–server model
- Describe the roles of browser, web server and database
- Understand what a URL is made of
- Distinguish the front end from the back end

## Explanation

The web is built on the **client–server model**. Your browser is the **client**: it sends requests and displays the results. A **web server** is a computer running software (like Nginx or a Node.js process) that listens for requests, works out the answer, and sends back a response. Often the server talks to a **database** to store and fetch data.

\`\`\`text
Browser (client)  --request-->  Web server  --query-->  Database
Browser          <--response--  Web server  <--data---  Database
\`\`\`

A **URL** (Uniform Resource Locator) addresses a specific resource:

\`\`\`text
https://example.com:443/roadmap?track=c#intro
|      |        |   |    |          |    |
scheme host     port path     query  fragment
\`\`\`

The **front end** is what runs in the browser — HTML structure, CSS styling, JavaScript interactivity. The **back end** is the server-side code that handles business logic, authentication and data. They communicate over HTTP using data formats like JSON.

## Examples

Think about what happens when you click "Log in" on a website:

1. The browser validates the form (front end).
2. The browser sends the credentials to the server over HTTP (network).
3. The server checks the database, verifies the password hash (back end).
4. The server replies with a session cookie.
5. The browser stores the cookie and shows the dashboard.

The front end never touches the database directly — it always goes through the server. This separation keeps data secure and logic centralized.

## Key Concepts
- **Client**: the browser or app making requests.
- **Server**: software that answers requests, usually with database access.
- **URL**: scheme + host + path + query that names a web resource.
- **Front end vs back end**: browser code vs server code.
- **HTTP**: the protocol clients and servers use to talk.

## Summary

The web works because browsers and servers follow the same rules. Clients send requests, servers respond, and databases store the state. Every feature you build — login, roadmaps, quizzes — fits into this same pattern.`,
    checkpoints: [
      {
        question: "Who does the browser talk to when it needs data?",
        options: ["The database directly", "The web server", "The DNS cache", "Another browser"],
        correctIndex: 1,
        explanation:
          "The front end always talks to the web server, never to the database directly. The server runs the queries and returns the response.",
      },
    ],
  },
  {
    skillId: "WEB_BASICS",
    title: "HTTP in Action",
    description:
      "Reading HTTP requests and responses: methods, status codes, and how cookies make stateless HTTP feel stateful.",
    estimatedMinutes: 10,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Read the structure of an HTTP request and response
- Understand methods: GET, POST, PUT, DELETE
- Recognize common status codes
- Understand cookies and sessions at a high level

## Explanation

**HTTP** (HyperText Transfer Protocol) is a request/response protocol. A request has a **method**, a **path**, **headers** and optionally a **body**. A response has a **status code**, **headers** and a **body**.

The most common methods:

- **GET** — fetch a resource (no side effects).
- **POST** — send data to create something (e.g. a new account).
- **PUT / PATCH** — update an existing resource.
- **DELETE** — remove a resource.

Status codes are grouped by their first digit:

\`\`\`text
2xx Success     200 OK, 201 Created
3xx Redirect    301 Moved Permanently, 302 Found
4xx Client error 400 Bad Request, 401 Unauthorized, 404 Not Found
5xx Server error 500 Internal Server Error
\`\`\`

:::warning
Never send passwords or tokens in the URL query string of a GET request — they end up in server logs and browser history. Use POST with a body over HTTPS.
:::

Because HTTP is **stateless**, the server does not remember you between requests. **Cookies** fix this: the server sends a small token, the browser stores it, and sends it back on every request. The server looks up the token to know who you are — that is a **session**.

## Examples

A login request:

\`\`\`http
POST /api/auth/login HTTP/1.1
Host: skillforge.app
Content-Type: application/json

{"email": "dev@example.com", "password": "secret"}
\`\`\`

A typical response:

\`\`\`http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session=abc123; HttpOnly; Path=/

{"user": {"username": "dev", "role": "STUDENT"}}
\`\`\`

## Key Concepts
- **GET/POST/PUT/DELETE**: read, create, update, delete.
- **Status codes**: 2xx success, 3xx redirect, 4xx client error, 5xx server error.
- **Stateless**: HTTP remembers nothing between requests on its own.
- **Cookie + session**: the mechanism that gives websites memory.

## Summary

HTTP is the language of the web. Know the four common methods and the meaning of 1xx–5xx status codes. Remember that HTTP itself is stateless — cookies and sessions are what make a "logged in" experience possible.`,
    checkpoints: [
      {
        question: "Which HTTP method should you use to fetch a resource without side effects?",
        options: ["POST", "PUT", "GET", "DELETE"],
        correctIndex: 2,
        explanation:
          "GET is used to fetch a resource and should have no side effects. POST creates, PUT/PATCH update, and DELETE removes.",
      },
    ],
  },
  {
    skillId: "WEB_BASICS",
    title: "DNS & What Happens When You Browse",
    description:
      "DNS, IP addresses, ports and HTTPS — plus the full journey of a URL from keystroke to rendered page.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Explain the role of DNS
- Trace what happens after you type a URL
- Understand IP addresses and ports
- Explain why HTTPS matters

## Explanation

Every computer on the internet has an **IP address** like \`142.250.72.14\`. Humans prefer names like \`google.com\`. The **Domain Name System (DNS)** is the phonebook that translates names into IP addresses. It is a global, distributed database served by DNS servers around the world.

A **port** is a numbered entrance on a server. Port 80 is the default for HTTP, port 443 for HTTPS, port 5432 for PostgreSQL. A URL like \`https://example.com\` really means "connect to example.com's IP address on port 443".

**HTTPS** wraps HTTP inside TLS encryption, so data between you and the server is protected from eavesdroppers. It also proves you are talking to the real server via certificates. Always use HTTPS in production.

## Examples

What happens when you type \`https://skillforge.app/dashboard\`?

\`\`\`text
1. Browser checks its DNS cache; if missing, asks a DNS server:
   "What is the IP address of skillforge.app?"
2. DNS replies with the IP address (e.g. 203.0.113.5).
3. Browser opens an encrypted (TLS) connection to that IP on port 443.
4. Browser sends: GET /dashboard HTTP/1.1  (with cookies).
5. Server checks your session cookie, runs the code, queries the DB.
6. Server responds: 200 OK with the dashboard HTML/JSON.
7. Browser renders the page and executes any JavaScript.
\`\`\`

Most of that happens in well under a second.

## Key Concepts
- **IP address**: the numeric address of a computer on a network.
- **DNS**: translates domain names into IP addresses.
- **Port**: a numbered service entrance on a server (80/443 HTTP(S)).
- **HTTPS**: encrypted HTTP using TLS.
- **Cache**: local storage that avoids repeating work (DNS, files, data).

## Summary

When you type a URL, DNS finds the server's IP, your browser opens an encrypted connection to the right port, sends an HTTP request, and renders the response. Understanding this whole pipeline makes debugging web apps dramatically easier.`,
    checkpoints: [
      {
        question: "What does DNS do?",
        options: [
          "Encrypts your traffic",
          "Translates domain names into IP addresses",
          "Stores website cookies",
          "Renders HTML pages",
        ],
        correctIndex: 1,
        explanation:
          "DNS (the Domain Name System) is the phonebook of the internet — it translates human-friendly names like google.com into the IP addresses computers actually use.",
      },
    ],
  },
];

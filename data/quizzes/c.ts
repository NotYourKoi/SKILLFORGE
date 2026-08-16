import type { QuizSeed } from "../types";

export const cQuizzes: QuizSeed[] = [
  {
    skillId: "C_BASICS",
    title: "C Programming Basics Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Which is the correct entry point of a C program?",
        explanation: "Execution always starts in the main() function.",
        options: [
          { text: "int main(void)", correct: true },
          { text: "void start()", correct: false },
          { text: "function main()", correct: false },
          { text: "int program()", correct: false },
        ],
      },
      {
        prompt: "Which printf format specifier prints an integer?",
        explanation: "%d (or %i) prints a signed decimal integer.",
        options: [
          { text: "%d", correct: true },
          { text: "%f", correct: false },
          { text: "%c", correct: false },
          { text: "%s", correct: false },
        ],
      },
      {
        prompt: "Which statement runs a block only when a condition is true?",
        explanation: "The if statement conditionally executes its block; else provides the alternative.",
        options: [
          { text: "if (condition) { ... }", correct: true },
          { text: "while (condition) { ... }", correct: false },
          { text: "for (;;) { ... }", correct: false },
          { text: "switch", correct: false },
        ],
      },
      {
        prompt: "What is the role of the semicolon in C statements?",
        explanation: "The semicolon terminates a statement.",
        options: [
          { text: "It terminates a statement", correct: true },
          { text: "It begins a comment", correct: false },
          { text: "It declares a variable", correct: false },
          { text: "It separates statements within a block", correct: false },
        ],
      },
      {
        prompt: "What does the #include <stdio.h> line do?",
        explanation: "It makes the standard input/output declarations (like printf) available to your program.",
        options: [
          { text: "Includes the standard input/output header", correct: true },
          { text: "Adds a library to the executable file", correct: false },
          { text: "Defines the main function", correct: false },
          { text: "Starts a comment block", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "C_POINTERS",
    title: "C Pointers Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "What does the * operator do in a variable declaration like int *p;?",
        explanation: "It declares p as a pointer to an int — a variable that holds an address.",
        options: [
          { text: "Declares p as a pointer to an int", correct: true },
          { text: "Multiplies p by its value", correct: false },
          { text: "Makes p constant", correct: false },
          { text: "Dereferences p", correct: false },
        ],
      },
      {
        prompt: "How do you get the address of a variable?",
        explanation: "The address-of operator & returns the memory address of a variable.",
        options: [
          { text: "&x", correct: true },
          { text: "*x", correct: false },
          { text: "x->address", correct: false },
          { text: "sizeof x", correct: false },
        ],
      },
      {
        prompt: "What does dereferencing a pointer do?",
        explanation: "Dereferencing (*p) accesses the value stored at the address the pointer holds.",
        options: [
          { text: "Accesses the value at the address it holds", correct: true },
          { text: "Frees the memory it points to", correct: false },
          { text: "Changes what it points to", correct: false },
          { text: "Returns the pointer's own address", correct: false },
        ],
      },
      {
        prompt: "What is a NULL pointer?",
        explanation: "A NULL pointer points to nothing and must not be dereferenced.",
        options: [
          { text: "A pointer that points to nothing and must not be dereferenced", correct: true },
          { text: "A pointer to a zero integer value", correct: false },
          { text: "A pointer that has been freed", correct: false },
          { text: "A pointer to the first byte of memory", correct: false },
        ],
      },
      {
        prompt: "Why do functions that need to modify a caller's variable take a pointer?",
        explanation: "C passes arguments by value, so a pointer is required to modify the caller's variable.",
        options: [
          { text: "C passes arguments by value; a pointer lets you modify the caller's variable", correct: true },
          { text: "To make the function run faster", correct: false },
          { text: "To allow the function to return two values", correct: false },
          { text: "Pointers are required for all function calls", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "C_MEM",
    title: "C Memory Management Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "Where do local variables live?",
        explanation: "Local (automatic) variables live on the stack and are destroyed when their function returns.",
        options: [
          { text: "The stack", correct: true },
          { text: "The heap", correct: false },
          { text: "The registers", correct: false },
          { text: "The disk", correct: false },
        ],
      },
      {
        prompt: "Which function allocates memory on the heap?",
        explanation: "malloc() allocates a requested number of bytes on the heap and returns a pointer.",
        options: [
          { text: "malloc()", correct: true },
          { text: "free()", correct: false },
          { text: "sizeof()", correct: false },
          { text: "scanf()", correct: false },
        ],
      },
      {
        prompt: "What must happen to every malloc'ed block before the program ends?",
        explanation: "Every allocated block must be released with free() to avoid a memory leak.",
        options: [
          { text: "It must be released with free()", correct: true },
          { text: "It must be reallocated with realloc()", correct: false },
          { text: "It is automatically released by the OS; nothing needed", correct: false },
          { text: "It must be initialized to zero", correct: false },
        ],
      },
      {
        prompt: "What is a dangling pointer?",
        explanation: "A pointer that still holds an address after the memory it points to was freed — dereferencing it is undefined behavior.",
        options: [
          { text: "A pointer used after the memory it points to was freed", correct: true },
          { text: "A pointer to a local variable", correct: false },
          { text: "A NULL pointer", correct: false },
          { text: "A pointer pointing to the middle of an array", correct: false },
        ],
      },
      {
        prompt: "Which is a symptom of a buffer overflow?",
        explanation: "Writing past an array's bounds corrupts adjacent memory and can crash or alter unrelated data.",
        options: [
          { text: "Writing past an array's bounds corrupts adjacent memory", correct: true },
          { text: "Forgetting to include a header", correct: false },
          { text: "Using the wrong printf specifier", correct: false },
          { text: "Declaring too many variables", correct: false },
        ],
      },
    ],
  },
  {
    skillId: "C_DSA",
    title: "C Data Structures & Algorithms Quiz",
    passScore: 70,
    questions: [
      {
        prompt: "What is the time complexity of accessing an array element by index?",
        explanation: "Array indexing is O(1) — direct address arithmetic, no traversal needed.",
        options: [
          { text: "O(1)", correct: true },
          { text: "O(n)", correct: false },
          { text: "O(log n)", correct: false },
          { text: "O(n log n)", correct: false },
        ],
      },
      {
        prompt: "What distinguishes a linked list from an array?",
        explanation: "A linked list stores elements in nodes linked by pointers, so it needs no contiguous memory and can grow freely.",
        options: [
          { text: "Nodes linked by pointers; no contiguous memory required", correct: true },
          { text: "Fixed size but faster random access", correct: false },
          { text: "Always sorted by value", correct: false },
          { text: "Stored directly in registers", correct: false },
        ],
      },
      {
        prompt: "Which structure gives O(1) insertion and removal at one end (LIFO)?",
        explanation: "A stack follows last-in-first-out with O(1) push/pop at the top.",
        options: [
          { text: "A stack", correct: true },
          { text: "A queue", correct: false },
          { text: "A hash table", correct: false },
          { text: "A binary search tree", correct: false },
        ],
      },
      {
        prompt: "What is the best-case and worst-case time of binary search on a sorted array?",
        explanation: "Each step halves the search space: O(log n) worst case.",
        options: [
          { text: "O(log n) worst case", correct: true },
          { text: "O(n) worst case", correct: false },
          { text: "O(1) worst case", correct: false },
          { text: "O(n²) worst case", correct: false },
        ],
      },
      {
        prompt: "Why does merge sort guarantee O(n log n) even in the worst case?",
        explanation: "It always divides the array in half and merges linearly, so no input order can degrade it.",
        options: [
          { text: "It always halves the input and merges in linear time", correct: true },
          { text: "It only works on already-sorted data", correct: false },
          { text: "It never compares elements", correct: false },
          { text: "It uses the hardware sort instruction", correct: false },
        ],
      },
    ],
  },
];

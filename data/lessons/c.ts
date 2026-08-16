import type { LessonSeed } from "../types";

export const cLessons: LessonSeed[] = [
  {
    skillId: "C_BASICS",
    title: "Getting Started with C",
    description:
      "Writing, compiling and running your first C program, and learning to read compiler error messages.",
    estimatedMinutes: 8,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Write, compile and run a C program
- Understand the role of main(), headers and the compiler
- Read basic compiler errors and fix them

## Explanation

C is a compiled, low-level language created in the 1970s. It gives you direct control over memory, which makes it fast and is why operating systems and embedded systems are written in it. The trade-off is that you are responsible for managing memory yourself.

A C program needs:
- A **preprocessor include** for standard functions, e.g. \`#include <stdio.h>\`.
- A **main function** where execution starts.
- Statements ending with a **semicolon**.

The **compiler** (e.g. \`gcc\`) translates your source into machine code. The two steps you will repeat constantly: compile, then run.

## Examples

Your first program:

\`\`\`c
#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}
\`\`\`

Compile and run (from a terminal):

\`\`\`bash
gcc hello.c -o hello
./hello
# Hello, world!
\`\`\`

Reading an error:

\`\`\`text
hello.c:4:5: error: expected ';' after expression
    printf("Hello")
    ^
    ;
\`\`\`

The compiler tells you the file, line, and column. Here it is saying: you forgot a semicolon at line 4.

## Key Concepts
- **Compiler**: turns source code into machine code (\`gcc\`, \`clang\`).
- **main()**: the entry point every program starts from.
- **stdio.h**: the standard input/output header with \`printf\`, \`scanf\`.
- **Return code**: \`return 0\` means "success" to the operating system.

## Summary

Write code in a \`.c\` file, compile it, run it. The compiler is your first reviewer — its error messages point to the exact line to fix.`,
    checkpoints: [
      {
        question: "Which function does every C program start executing from?",
        options: ["init()", "main()", "start()", "run()"],
        correctIndex: 1,
        explanation:
          "Execution begins at main(). It typically returns 0 to signal success to the operating system.",
      },
    ],
  },
  {
    skillId: "C_BASICS",
    title: "Variables, Types & Operators",
    description:
      "Choosing the right primitive type, and avoiding the integer division and overflow traps.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Declare variables with the correct primitive type
- Explain the size of each type
- Use arithmetic, relational and logical operators
- Understand integer division and overflow

## Explanation

In C every variable has a **type** that fixes how much memory it uses and what values it can hold. Choosing the right type matters because the machine only allocates the bytes you ask for.

\`\`\`c
char   c = 'A';     // 1 byte, a single character
int    n = 42;      // usually 4 bytes, whole numbers
float  f = 3.14f;   // 4 bytes, approximate decimals
double d = 3.14159; // 8 bytes, more precise decimals
\`\`\`

Be careful with two classic pitfalls:

1. **Integer division** — \`7 / 2\` is \`3\`, not \`3.5\`. Both operands are integers, so the result is truncated. Use \`7.0 / 2\` for a decimal answer.
2. **Overflow** — an \`int\` has a maximum value. Add 1 to the largest \`int\` and you wrap around to a negative number.

## Examples

\`\`\`c
#include <stdio.h>

int main(void) {
    int a = 7, b = 2;
    printf("7 / 2 = %d\\n", a / b);        // prints 3 (integer division)
    printf("7.0 / 2 = %.1f\\n", 7.0 / 2);  // prints 3.5

    int max = 2147483647;
    printf("max + 1 = %d\\n", max + 1);    // prints -2147483648 (overflow!)

    int x = 10;
    int isBig = (x > 5) && (x < 20);       // 1 (true)
    printf("isBig = %d\\n", isBig);
    return 0;
}
\`\`\`

Operators: arithmetic (\`+\`, \`-\`, \`*\`, \`/\`, \`%\`), relational (\`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`), logical (\`&&\`, \`||\`, \`!\`).

## Key Concepts
- **char / int / float / double**: the core primitive types.
- **Integer division**: truncates the fractional part.
- **Overflow**: exceeding a type's range wraps the value.
- **printf specifiers**: \`%d\` int, \`%c\` char, \`%f\` float, \`%s\` string.

## Summary

Types determine how memory is used and what values are possible. Watch out for integer division and overflow — both produce silent, surprising bugs that are very common in C.`,
    checkpoints: [
      {
        question: "What does 7 / 2 evaluate to in C?",
        options: ["3.5", "3", "3.0", "It is a compile error"],
        correctIndex: 1,
        explanation:
          "Both operands are int, so the division is integer division and the fractional part is truncated: 7 / 2 == 3. Use 7.0 / 2 for 3.5.",
      },
    ],
  },
  {
    skillId: "C_BASICS",
    title: "Control Flow & Functions",
    description:
      "Conditionals, loops and functions — the building blocks that give programs decisions, repetition and structure.",
    estimatedMinutes: 12,
    difficulty: "Beginner",
    content: `## Learning Objectives
- Write if/else and switch conditionals
- Write for and while loops
- Break code into functions with parameters and return values

## Explanation

Programs need decisions and repetition. C gives you **conditionals** (\`if\`/\`else\`, \`switch\`) and **loops** (\`while\`, \`for\`, \`do-while\`).

A **function** is a named, reusable block of code with parameters and a return type. Functions are how you decompose programs and avoid repetition. The \`main\` function calls other functions to do the work.

Remember: in C, every value has a truthiness — \`0\` is false, anything non-zero is true.

## Examples

\`\`\`c
#include <stdio.h>

// Function: returns whether n is even
int isEven(int n) {
    return n % 2 == 0;
}

int sumFrom1To(int n) {
    int total = 0;
    for (int i = 1; i <= n; i++) {
        total += i;
    }
    return total;
}

int main(void) {
    int n = 10;
    if (isEven(n)) {
        printf("%d is even\\n", n);
    } else {
        printf("%d is odd\\n", n);
    }

    int i = 0;
    while (i < 3) {
        printf("loop: %d\\n", i);
        i++;
    }

    printf("sum 1..10 = %d\\n", sumFrom1To(10)); // 55
    return 0;
}
\`\`\`

A switch for menu handling:

\`\`\`c
char choice = 'b';
switch (choice) {
    case 'a': printf("Start\\n"); break;
    case 'b': printf("Load\\n");  break;
    default:  printf("Unknown\\n");
}
\`\`\`

## Key Concepts
- **if/else, switch**: branch on conditions.
- **for, while, do-while**: repeat code; know when each fits.
- **break**: exit a loop or switch early.
- **Function signature**: return type + name + parameters.

## Summary

Control flow gives your program decisions and loops; functions give it structure. A well-factored program is a small \`main\` plus small, single-purpose functions.`,
    checkpoints: [
      {
        question: "In C, which value counts as false in a condition?",
        options: ["1", "-1", "0", "NULL is the only false value"],
        correctIndex: 2,
        explanation:
          "Zero is false and any non-zero value is true. C has no separate boolean type in its classic form.",
      },
    ],
  },
  {
    skillId: "C_POINTERS",
    title: "Memory & Addresses",
    description:
      "Variables, their addresses and the address-of and dereference operators — the gateway to C.",
    estimatedMinutes: 10,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Explain the difference between a variable and its address
- Use the address-of operator \`&\`
- Read pointer declarations like \`int *p\`
- Explain dereferencing with \`*\`

## Explanation

Every variable lives at an **address** in memory. The address is just a number — the location of the first byte of the variable.

A **pointer** is a variable that *stores an address*. You declare a pointer with \`*\`:

\`\`\`c
int x = 42;     // a normal int
int *p = &x;    // p stores the address of x; & is "address of"
\`\`\`

To read or write the value that a pointer points to, you **dereference** it with \`*\`:

\`\`\`c
printf("%d\\n", *p);  // prints 42 — the value at address p
*p = 99;             // changes x to 99
\`\`\`

The type \`int *\` says "a pointer to an int". The type matters because when you dereference, the computer needs to know how many bytes to read and how to interpret them.

## Examples

\`\`\`c
#include <stdio.h>

int main(void) {
    int x = 10;
    int *p = &x;

    printf("value of x: %d\\n", x);      // 10
    printf("address of x: %p\\n", (void*)&x); // e.g. 0x7ffee4b2a
    printf("value of p: %p\\n", (void*)p);    // same address
    printf("value at p: %d\\n", *p);          // 10

    *p = 25;
    printf("x is now: %d\\n", x);        // 25 — changed through the pointer

    return 0;
}
\`\`\`

A pointer is always the same size regardless of what it points to, because it only stores a memory address (typically 8 bytes on 64-bit systems).

## Key Concepts
- **Address**: the location of a variable in memory.
- **& operator**: "address of" — gives a variable's address.
- **\* operator**: "dereference" — reads/writes the value at an address.
- **NULL pointer**: a pointer to nothing, used to signal "no target".

## Summary

A pointer holds an address. \`&\` gets an address; \`*\` follows it. Pointers are the gateway to arrays, strings and dynamic memory — the core of C.`,
    checkpoints: [
      {
        question: "What does the & operator do?",
        options: [
          "Multiplies two values",
          "Returns the address of a variable",
          "Dereferences a pointer",
          "Creates a new variable",
        ],
        correctIndex: 1,
        explanation:
          "& is the address-of operator. int *p = &x; stores the address of x in p. The * operator dereferences (follows) a pointer.",
      },
    ],
  },
  {
    skillId: "C_POINTERS",
    title: "Pointers in Practice",
    description:
      "Why C passes by value, and how passing addresses lets functions change the caller's variables.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Pass variables to functions by pointer to modify them
- Use pointers as function parameters safely
- Understand why C passes by value by default

## Explanation

In C, function arguments are passed **by value**: the function receives a *copy*. So modifying a parameter inside a function never changes the caller's variable.

To actually modify a variable from inside a function, pass its **address** (a pointer). The function dereferences the pointer to write through to the original variable. This is one of the main reasons pointers exist.

The **null pointer** (\`NULL\`) is a sentinel meaning "points to nothing". Always check a pointer for \`NULL\` before dereferencing — dereferencing \`NULL\` crashes the program (segmentation fault).

## Examples

A swap function — the classic "why pointers?" example:

\`\`\`c
#include <stdio.h>

// Swaps the values of two ints at the given addresses
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main(void) {
    int x = 3, y = 7;
    printf("before: x=%d y=%d\\n", x, y); // 3 7
    swap(&x, &y);
    printf("after:  x=%d y=%d\\n", x, y); // 7 3
    return 0;
}
\`\`\`

If we had written \`void swap(int a, int b)\`, only the copies would swap — the originals would be untouched.

## Key Concepts
- **Pass by value**: functions get copies of arguments.
- **Pass by pointer**: pass \`&var\`, dereference inside to modify the original.
- **NULL checks**: verify pointers before dereferencing.
- **Segmentation fault**: crash caused by bad memory access.

## Summary

C functions cannot change their arguments unless you pass pointers. This "by value by default, pointer to mutate" rule explains a huge amount of C code — including how strings and arrays are handled.`,
    checkpoints: [
      {
        question: "Why does swap need int *a, int *b instead of int a, int b?",
        options: [
          "Pointers make the function faster",
          "Without pointers the function only modifies copies",
          "C requires all parameters to be pointers",
          "It doesn't — both work equally",
        ],
        correctIndex: 1,
        explanation:
          "C passes arguments by value, so a function receives copies. Dereferencing pointers lets the function write through to the caller's original variables.",
      },
    ],
  },
  {
    skillId: "C_POINTERS",
    title: "Arrays & Pointer Arithmetic",
    description:
      "Contiguous memory, array decay, and why arr[i] is the same as *(arr + i).",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Understand how arrays are stored in contiguous memory
- Explain how arrays "decay" to pointers
- Use pointer arithmetic to walk an array
- Index arrays with bracket notation

## Explanation

An **array** is a block of contiguous memory holding elements of the same type. The name of an array **decays** to a pointer to its first element in most expressions.

Because elements are laid out back-to-back, you can reach element \`i\` by pointer arithmetic: \`arr + i\` is the address of element \`i\`, and \`*(arr + i)\` is its value. The compiler multiplies the offset by the element size for you — adding 1 to an \`int *\` moves 4 bytes, not 1.

\`\`\`c
int arr[5] = {10, 20, 30, 40, 50};
arr[2] == *(arr + 2)   // both are 30
\`\`\`

**Important:** C arrays have no built-in length. If you pass an array to a function, you must pass its size separately — the function cannot find it out by itself.

## Examples

\`\`\`c
#include <stdio.h>

// Sum all elements; note: must receive the size too
int sum(int *arr, int size) {
    int total = 0;
    for (int i = 0; i < size; i++) {
        total += *(arr + i);   // same as arr[i]
    }
    return total;
}

int main(void) {
    int prices[4] = {10, 20, 30, 40};

    // walk with a pointer
    int *p = prices;
    for (int i = 0; i < 4; i++) {
        printf("price[%d] = %d at %p\\n", i, *p, (void*)p);
        p++;  // move to the next int (4 bytes later)
    }

    printf("sum = %d\\n", sum(prices, 4)); // 100
    return 0;
}
\`\`\`

## Key Concepts
- **Contiguous memory**: array elements sit side by side.
- **Decay**: \`arr\` becomes \`int *\` pointing at the first element.
- **Pointer arithmetic**: \`ptr + i\` moves by \`i * sizeof(type)\`.
- **No bounds checking**: reading past the end is undefined behavior.

## Summary

Arrays are contiguous memory, and their name decays to a pointer. \`arr[i]\` and \`*(arr + i)\` are identical — which is why arrays and pointers in C are inseparable. Always pass the size explicitly.`,
    checkpoints: [
      {
        question: "After int *p = arr with arr an int array, what does p + 1 point to?",
        options: [
          "One byte past arr[0]",
          "The next int, sizeof(int) bytes later",
          "The address of arr itself",
          "The last element",
        ],
        correctIndex: 1,
        explanation:
          "Pointer arithmetic scales by the element size — adding 1 to an int * moves to the next int (typically 4 bytes later).",
      },
    ],
  },
  {
    skillId: "C_MEM",
    title: "Stack vs Heap",
    description:
      "Automatic stack frames vs manually managed heap memory, and why locals die when functions return.",
    estimatedMinutes: 10,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Distinguish stack and heap memory
- Explain the lifetime of stack variables
- Know when you must use the heap
- Understand why stack overflow happens

## Explanation

Your program has two main regions of memory.

The **stack** grows automatically as functions are called. Each call pushes a **frame** holding local variables. When the function returns, its frame is popped and its locals vanish. Stack allocation is fast and needs no cleanup — but the lifetime of a stack variable ends when its function returns.

The **heap** is a large pool managed manually. You request memory with \`malloc\`, and it stays alive until you release it with \`free\`. Heap allocation is slower and requires discipline, but the memory outlives any single function call.

The classic bug is **returning a pointer to a local (stack) variable** — the memory no longer exists by the time the caller uses it. Such dangling pointers cause undefined behavior.

## Examples

\`\`\`c
// BUG: returns a pointer to a stack variable that dies on return
int *bad(void) {
    int local = 42;
    return &local;  // 'local' is gone when the function returns
}
\`\`\`

The correct version allocates on the heap:

\`\`\`c
int *good(void) {
    int *p = malloc(sizeof(int));
    if (p == NULL) return NULL;
    *p = 42;
    return p;      // lives on until free()
}
\`\`\`

Recursion also uses the stack. If a recursive function never reaches its base case, the stack runs out — that is a **stack overflow**.

## Key Concepts
- **Stack**: automatic, fast, per-function lifetime.
- **Heap**: manual, slower, caller-controlled lifetime.
- **Dangling pointer**: points at freed/gone memory.
- **Stack overflow**: running out of stack space (usually recursion).

## Summary

Use the stack for short-lived locals; use the heap when data must outlive the function that created it. Every heap allocation must be freed exactly once.`,
    checkpoints: [
      {
        question: "When does a local stack variable stop existing?",
        options: [
          "When the program ends",
          "When its function returns",
          "When you call free()",
          "Never — it stays until overwritten",
        ],
        correctIndex: 1,
        explanation:
          "Stack variables live inside a function's frame. When the function returns, the frame is popped and its locals are gone — returning a pointer to one is the classic dangling pointer bug.",
      },
    ],
  },
  {
    skillId: "C_MEM",
    title: "malloc, calloc & free",
    description:
      "Allocating heap memory, checking for NULL, and the allocate–check–use–free rhythm of safe C.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Allocate dynamic memory with malloc and calloc
- Release it correctly with free
- Check allocation results for NULL
- Match every malloc with exactly one free

## Explanation

\`malloc(size)\` allocates \`size\` bytes and returns a pointer to the start, or \`NULL\` if there is not enough memory. It does not initialize the memory — the bytes are whatever was there before.

\`calloc(count, size)\` allocates \`count * size\` bytes **and zeroes them**.

\`free(ptr)\` returns the memory to the heap. After freeing, the pointer is **dangling** — using it is a serious bug. Set it to \`NULL\` after freeing to avoid accidents.

Every block you allocate must be freed exactly once. Forgetting to free is a **memory leak**; freeing twice is a **double free** — both are bugs that corrupt or exhaust memory.

## Examples

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 5;

    // malloc: uninitialized
    int *arr = malloc(n * sizeof(int));
    if (arr == NULL) {           // always check!
        fprintf(stderr, "allocation failed\\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        arr[i] = i * i;          // write values yourself
    }

    // calloc: zeroed
    int *zeros = calloc(n, sizeof(int));
    if (zeros == NULL) { free(arr); return 1; }
    // zeros[0..4] are all 0

    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");

    free(arr);    // release both blocks
    free(zeros);
    return 0;
}
\`\`\`

A grow-as-needed pattern using realloc:

\`\`\`c
int capacity = 2, size = 0;
int *list = malloc(capacity * sizeof(int));
// ... append:
if (size == capacity) {
    capacity *= 2;
    int *bigger = realloc(list, capacity * sizeof(int));
    if (bigger == NULL) { free(list); return 1; }
    list = bigger;
}
list[size++] = 42;
\`\`\`

## Key Concepts
- **malloc/calloc**: allocate heap memory (calloc zeroes it).
- **free**: release heap memory; match one-to-one with allocation.
- **NULL check**: verify allocation succeeded before using the pointer.
- **Leak / double free**: too little or too much freeing.

## Summary

Allocate with malloc/calloc, always check for NULL, use the memory, and free it exactly once. This allocate–check–use–free rhythm is the heart of safe C memory management.`,
    checkpoints: [
      {
        question: "What is the difference between calloc(n, size) and malloc(n * size)?",
        options: [
          "calloc is faster",
          "calloc zeroes the allocated memory",
          "malloc checks for NULL, calloc does not",
          "There is no difference",
        ],
        correctIndex: 1,
        explanation:
          "Both allocate n * size bytes, but calloc also initializes the memory to zero. malloc leaves the bytes uninitialized.",
      },
    ],
  },
  {
    skillId: "C_MEM",
    title: "Memory Leaks & Common Bugs",
    description:
      "Recognizing leaks, double frees and buffer overflows — and the tools that find them.",
    estimatedMinutes: 12,
    difficulty: "Intermediate",
    content: `## Learning Objectives
- Recognize the symptoms of a memory leak
- Use tools to find leaks and invalid accesses
- Avoid dangling pointers and double frees
- Write memory-safe patterns

## Explanation

The most common C memory bugs:

1. **Leak** — you allocate but never free. Long-running programs slowly eat memory until the OS kills them.
2. **Double free** — you free the same pointer twice, corrupting the heap.
3. **Dangling pointer** — you use memory after freeing it, or after the function that owned it returned.
4. **Buffer overflow** — you write past the end of an array, silently corrupting neighboring data (this is how many security exploits start).

Tools make these bugs findable. **Valgrind** (Linux/macOS) reports leaks and invalid reads/writes. **AddressSanitizer** (\`-fsanitize=address\`) catches the same problems at runtime on most compilers including Windows/macOS.

## Examples

Compile with sanitizers to catch bugs at runtime:

\`\`\`bash
gcc -g -fsanitize=address program.c -o program
./program
\`\`\`

A leak checker pattern — every allocation should have a matching free:

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

int *buildArray(int n) {
    int *arr = malloc(n * sizeof(int));
    if (arr == NULL) return NULL;
    for (int i = 0; i < n; i++) arr[i] = i;
    return arr;
}

int main(void) {
    int *a = buildArray(10);
    if (a != NULL) {
        printf("%d\\n", a[0]);
        free(a);      // the ONLY free for this allocation
        a = NULL;     // avoid a dangling pointer
    }
    return 0;
}
\`\`\`

Safe idiom: after \`free(p)\`, immediately \`p = NULL\`. A NULL pointer crash is a loud, debuggable error; a dangling pointer corrupts data silently.

## Key Concepts
- **Memory leak**: unfreed heap memory.
- **Double free / use-after-free**: freeing or using memory that is already gone.
- **Buffer overflow**: writing past an array's end.
- **Valgrind / ASan**: the tools that find all of the above.

## Summary

C gives you raw memory power, and with it, responsibility. Leaks, double frees and buffer overflows are the classic bugs — learn to write the "allocate, check, use, free, NULL" pattern by default, and run sanitizers early.`,
    checkpoints: [
      {
        question: "What is a memory leak?",
        options: [
          "Freeing the same pointer twice",
          "Allocating memory that is never freed",
          "Writing past the end of an array",
          "Using memory after freeing it",
        ],
        correctIndex: 1,
        explanation:
          "A leak is memory you allocate but never free. Freeing twice is a double free, writing past an array end is a buffer overflow, and using freed memory is a use-after-free.",
      },
    ],
  },
  {
    skillId: "C_DSA",
    title: "Linked Lists in C",
    description:
      "Nodes connected by pointers, head insertion in O(1), and why lists trade random access for flexibility.",
    estimatedMinutes: 15,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Define a node struct for a linked list
- Insert and delete nodes correctly
- Traverse a list with a pointer loop
- Explain the cost of list operations

## Explanation

A **linked list** is a sequence of nodes, each holding a value and a pointer to the next node. Unlike an array, it is not contiguous: nodes can live anywhere in memory.

\`\`\`c
typedef struct Node {
    int value;
    struct Node *next;
} Node;
\`\`\`

A list is identified by a pointer to its **head** node. The last node's \`next\` is \`NULL\`, which marks the end.

Trade-offs vs arrays:
- Insert/delete at the head: O(1) — cheap.
- Random access by index: O(n) — you must walk the list.
- No wasted space from preallocation; memory grows one node at a time.

Inserting at the head is the classic beginner-friendly operation:

\`\`\`c
Node *push(Node *head, int value) {
    Node *newNode = malloc(sizeof(Node));
    if (newNode == NULL) return head;
    newNode->value = value;
    newNode->next = head;   // new node points to old head
    return newNode;         // new head
}
\`\`\`

Deleting requires updating the *previous* node's \`next\` — that is why you keep track of two pointers while walking.

## Summary

A linked list is nodes connected by pointers, tracked by a head. It trades O(1) head insertion for O(n) lookup, and it exercises your pointer skills directly. Build one by hand — insert, delete, search, free — and you will understand both lists and pointers deeply.`,
    checkpoints: [
      {
        question: "What marks the end of a linked list?",
        options: [
          "A node whose next pointer is NULL",
          "A node with value 0",
          "The head node",
          "A node whose value is -1",
        ],
        correctIndex: 0,
        explanation:
          "The last node's next pointer is NULL, which terminates the chain. Traversal stops when the current pointer becomes NULL.",
      },
    ],
  },
  {
    skillId: "C_DSA",
    title: "Stacks & Queues",
    description:
      "The LIFO and FIFO contracts, implemented on arrays and linked lists.",
    estimatedMinutes: 15,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Explain the LIFO and FIFO contracts
- Implement a stack with a dynamic array
- Implement a queue with a linked list
- Match operations to real problems

## Explanation

**Stacks** and **queues** are abstract data types: they define *behavior*, not storage. You can implement either with an array or a linked list.

- A **stack** is LIFO (Last In, First Out). \`push\` adds to the top, \`pop\` removes from the top. Like a pile of plates — the last plate placed is the first removed.
- A **queue** is FIFO (First In, First Out). \`enqueue\` adds to the back, \`dequeue\` removes from the front. Like a line of people at a counter.

Where they show up: function call stack (recursion), undo/redo (stack), browser history (stack), task scheduling, print queues, and breadth-first search (queue).

## Examples

A stack implemented with a fixed-size array:

\`\`\`c
typedef struct {
    int data[100];
    int top;   // index of the next free slot
} Stack;

void push(Stack *s, int v) { s->data[s->top++] = v; }
int pop(Stack *s)           { return s->data[--s->top]; }
int isEmpty(Stack *s)       { return s->top == 0; }
\`\`\`

A queue needs to grow at the back and shrink at the front — a linked list is a natural fit:

\`\`\`c
typedef struct QNode { int value; struct QNode *next; } QNode;
typedef struct { QNode *front, *rear; } Queue;

void enqueue(Queue *q, int v) {
    QNode *n = malloc(sizeof(QNode));
    n->value = v; n->next = NULL;
    if (q->rear == NULL) { q->front = q->rear = n; return; }
    q->rear->next = n;
    q->rear = n;
}

int dequeue(Queue *q) {
    QNode *tmp = q->front;
    int v = tmp->value;
    q->front = tmp->next;
    if (q->front == NULL) q->rear = NULL;
    free(tmp);
    return v;
}
\`\`\`

## Summary

Stacks (LIFO) and queues (FIFO) are behavioral contracts implemented on top of arrays or lists. Learn to think in terms of "what operations must be O(1)?" — that decides the implementation.`,
    checkpoints: [
      {
        question: "A queue processes items in which order?",
        options: [
          "LIFO — last in, first out",
          "FIFO — first in, first out",
          "Random order",
          "Sorted by value",
        ],
        correctIndex: 1,
        explanation:
          "A queue is FIFO (First In, First Out) — like a line of people. A stack is LIFO — like a pile of plates.",
      },
    ],
  },
  {
    skillId: "C_DSA",
    title: "Binary Trees",
    description:
      "Nodes with up to two children, the ordering invariant of a BST, and the three traversals.",
    estimatedMinutes: 15,
    difficulty: "Advanced",
    content: `## Learning Objectives
- Define a binary tree node and its invariants
- Traverse a tree: in-order, pre-order, post-order
- Insert into a binary search tree
- Analyze the height of the tree

## Explanation

A **binary tree** is a hierarchy where every node has up to two children: left and right. A **binary search tree (BST)** adds an ordering rule that makes search fast:

- Everything in the left subtree is smaller than the node.
- Everything in the right subtree is larger.

Thanks to that rule, searching resembles binary search on the tree structure: each comparison discards half the tree. In a balanced tree, lookups are O(log n).

\`\`\`c
typedef struct TreeNode {
    int value;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

TreeNode *insert(TreeNode *root, int v) {
    if (root == NULL) {
        TreeNode *n = malloc(sizeof(TreeNode));
        n->value = v; n->left = n->right = NULL;
        return n;
    }
    if (v < root->value) root->left  = insert(root->left, v);
    else                 root->right = insert(root->right, v);
    return root;
}
\`\`\`

Recursion is natural for trees because a subtree is itself a tree. The three traversals visit nodes in different orders:

\`\`\`c
// in-order: left, node, right  -> prints values sorted
void inorder(TreeNode *root) {
    if (root == NULL) return;
    inorder(root->left);
    printf("%d ", root->value);
    inorder(root->right);
}
\`\`\`

Pre-order is (node, left, right); post-order is (left, right, node). In-order on a BST prints the values in sorted order.

**Warning:** if you insert values in sorted order (1,2,3,...), the tree degenerates into a linked list and search becomes O(n). Balanced structures like AVL or red–black trees fix this.

## Summary

Binary search trees make lookup logarithmic by keeping data ordered. Master recursive insertion and the three traversals, and remember: the ordering invariant is what makes the tree useful — unbalanced input defeats it.`,
    checkpoints: [
      {
        question: "In-order traversal of a binary search tree visits values in what order?",
        options: [
          "Sorted order",
          "Reverse sorted order",
          "Random order",
          "Root first",
        ],
        correctIndex: 0,
        explanation:
          "In-order visits left subtree, then the node, then the right subtree — which prints a BST's values in ascending sorted order.",
      },
    ],
  },
];

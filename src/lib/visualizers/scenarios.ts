import type { MemoryScenario, OwnershipScenario } from "./types";

export const MEMORY_SCENARIOS: MemoryScenario[] = [
  {
    id: "c-stack-heap",
    title: "C: Stack Frame & Heap Allocation (malloc/free)",
    track: "C01",
    language: "c",
    description: "Witness how local variables push onto the Call Stack, while dynamic memory allocates onto the Heap with a linking pointer.",
    code: [
      "int main() {",
      "    int score = 100;",
      "    int *buffer = malloc(3 * sizeof(int));",
      "    buffer[0] = 42;",
      "    free(buffer);",
      "    return 0;",
      "}",
    ],
    steps: [
      {
        stepNumber: 1,
        codeLine: 1,
        codeSnippet: "int main() {",
        explanation: "Entering function `main()`. A new Stack Frame is initialized on the Call Stack.",
        stack: [
          {
            functionName: "main()",
            variables: [],
          },
        ],
        heap: [],
        activeAction: "PUSH_FRAME",
      },
      {
        stepNumber: 2,
        codeLine: 2,
        codeSnippet: "    int score = 100;",
        explanation: "Stack allocation: Local integer variable `score` is pushed to the stack at address `0x7FFE04`.",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "score", type: "int", value: "100", address: "0x7FFE04", isHighlighted: true },
            ],
          },
        ],
        heap: [],
        activeAction: "ALLOC_STACK",
      },
      {
        stepNumber: 3,
        codeLine: 3,
        codeSnippet: "    int *buffer = malloc(3 * sizeof(int));",
        explanation: "`malloc(12)` allocates 12 bytes on the Heap at address `0x10A000`. Pointer variable `buffer` on the Stack stores this heap address.",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "score", type: "int", value: "100", address: "0x7FFE04" },
              { name: "buffer", type: "int*", value: "0x10A000", address: "0x7FFE08", pointsTo: "0x10A000", isHighlighted: true },
            ],
          },
        ],
        heap: [
          {
            id: "heap-1",
            address: "0x10A000",
            label: "int[3]",
            sizeBytes: 12,
            value: "[ ?, ?, ? ]",
            allocatedBy: "malloc()",
            isHighlighted: true,
          },
        ],
        activeAction: "ALLOC_HEAP",
      },
      {
        stepNumber: 4,
        codeLine: 4,
        codeSnippet: "    buffer[0] = 42;",
        explanation: "Pointer dereference: Writing `42` into the first index of the heap-allocated array at `0x10A000`.",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "score", type: "int", value: "100", address: "0x7FFE04" },
              { name: "buffer", type: "int*", value: "0x10A000", address: "0x7FFE08", pointsTo: "0x10A000" },
            ],
          },
        ],
        heap: [
          {
            id: "heap-1",
            address: "0x10A000",
            label: "int[3]",
            sizeBytes: 12,
            value: "[ 42, ?, ? ]",
            allocatedBy: "malloc()",
            isHighlighted: true,
          },
        ],
        activeAction: "MUTATE",
      },
      {
        stepNumber: 5,
        codeLine: 5,
        codeSnippet: "    free(buffer);",
        explanation: "`free(buffer)` releases the 12-byte heap segment back to the operating system. Notice `buffer` on stack is now a dangling pointer if not nulled!",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "score", type: "int", value: "100", address: "0x7FFE04" },
              { name: "buffer", type: "int* (dangling)", value: "0x10A000", address: "0x7FFE08", isHighlighted: true },
            ],
          },
        ],
        heap: [
          {
            id: "heap-1",
            address: "0x10A000",
            label: "FREED",
            sizeBytes: 0,
            value: "(memory reclaimed)",
            allocatedBy: "malloc()",
            isFreed: true,
            isHighlighted: true,
          },
        ],
        activeAction: "FREE_HEAP",
      },
      {
        stepNumber: 6,
        codeLine: 6,
        codeSnippet: "    return 0;",
        explanation: "Function `main()` returns. The Stack Frame is popped and all stack memory is instantly discarded.",
        stack: [],
        heap: [],
        activeAction: "POP_FRAME",
      },
    ],
  },
  {
    id: "rust-stack-heap",
    title: "Rust: String Layout (Stack metadata + Heap buffer)",
    track: "C04",
    language: "rust",
    description: "See how a Rust `String` consists of 24 bytes on the Stack (ptr, len, cap) pointing to UTF-8 bytes on the Heap, automatically dropped on scope exit.",
    code: [
      "fn main() {",
      "    let id: u32 = 7;",
      "    let mut s = String::from(\"KOI\");",
      "    s.push('!');",
      "    // End of main -> s is automatically dropped",
      "}",
    ],
    steps: [
      {
        stepNumber: 1,
        codeLine: 1,
        codeSnippet: "fn main() {",
        explanation: "Function `main()` starts. A new stack frame is allocated for main's local variables.",
        stack: [
          {
            functionName: "main()",
            variables: [],
          },
        ],
        heap: [],
        activeAction: "PUSH_FRAME",
      },
      {
        stepNumber: 2,
        codeLine: 2,
        codeSnippet: "    let id: u32 = 7;",
        explanation: "Primitive `u32` (4 bytes) stored directly on the stack frame.",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "id", type: "u32", value: "7", address: "0x7FFE10", isHighlighted: true },
            ],
          },
        ],
        heap: [],
        activeAction: "ALLOC_STACK",
      },
      {
        stepNumber: 3,
        codeLine: 3,
        codeSnippet: "    let mut s = String::from(\"KOI\");",
        explanation: "`String` allocates 3 bytes on the Heap (`0x20B000`) and places a 3-word triplet on the stack: ptr=0x20B000, len=3, cap=3.",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "id", type: "u32", value: "7", address: "0x7FFE10" },
              { name: "s (ptr, len=3, cap=3)", type: "String", value: "ptr: 0x20B000", address: "0x7FFE18", pointsTo: "0x20B000", isHighlighted: true },
            ],
          },
        ],
        heap: [
          {
            id: "rust-heap-1",
            address: "0x20B000",
            label: "String buffer",
            sizeBytes: 3,
            value: "\"KOI\" (UTF-8 bytes)",
            allocatedBy: "String::from()",
            isHighlighted: true,
          },
        ],
        activeAction: "ALLOC_HEAP",
      },
      {
        stepNumber: 4,
        codeLine: 4,
        codeSnippet: "    s.push('!');",
        explanation: "`push('!')` extends string to 4 bytes. Heap capacity is reallocated to accommodate growth (`len=4, cap=6`).",
        stack: [
          {
            functionName: "main()",
            variables: [
              { name: "id", type: "u32", value: "7", address: "0x7FFE10" },
              { name: "s (ptr, len=4, cap=6)", type: "String", value: "ptr: 0x20B000", address: "0x7FFE18", pointsTo: "0x20B000", isHighlighted: true },
            ],
          },
        ],
        heap: [
          {
            id: "rust-heap-1",
            address: "0x20B000",
            label: "String buffer",
            sizeBytes: 6,
            value: "\"KOI!\" (4 bytes active / 6 cap)",
            allocatedBy: "s.push()",
            isHighlighted: true,
          },
        ],
        activeAction: "MUTATE",
      },
      {
        stepNumber: 5,
        codeLine: 5,
        codeSnippet: "    // End of main -> s is automatically dropped",
        explanation: "Scope ends: Rust's RAII automatically calls `drop(s)` which frees heap buffer `0x20B000`. No memory leaks, zero manual free() required!",
        stack: [],
        heap: [
          {
            id: "rust-heap-1",
            address: "0x20B000",
            label: "FREED VIA DROP",
            sizeBytes: 0,
            value: "(auto-reclaimed via RAII)",
            allocatedBy: "drop(s)",
            isFreed: true,
            isHighlighted: true,
          },
        ],
        activeAction: "POP_FRAME",
      },
    ],
  },
];

export const OWNERSHIP_SCENARIOS: OwnershipScenario[] = [
  {
    id: "rust-move-semantics",
    title: "Rust Ownership Move (Transfer of Ownership)",
    description: "Understand why assigning `s2 = s1` invalidates `s1` to prevent double-free bugs at runtime.",
    code: [
      "let s1 = String::from(\"forge\");",
      "let s2 = s1; // MOVE OCCURS",
      "// println!(\"{}\", s1); -> COMPILE ERROR: value borrowed after move",
      "println!(\"{}\", s2); // s2 is valid owner",
    ],
    steps: [
      {
        stepNumber: 1,
        codeLine: 1,
        codeSnippet: "let s1 = String::from(\"forge\");",
        explanation: "`s1` is initialized. It is the sole OWNER of heap resource \"forge\" at `0x30C000`.",
        variables: [
          { name: "s1", type: "String", resourceId: "res-1", state: "OWNER", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-1", label: "\"forge\"", heapAddress: "0x30C000", currentOwner: "s1", activeBorrows: [], isDropped: false },
        ],
        activeAction: "DECLARE",
      },
      {
        stepNumber: 2,
        codeLine: 2,
        codeSnippet: "let s2 = s1; // MOVE OCCURS",
        explanation: "MOVE: Ownership of heap resource `0x30C000` transfers from `s1` to `s2`. `s1` is now INVALIDATED in the compiler's eyes.",
        variables: [
          { name: "s1", type: "String", resourceId: "res-1", state: "MOVED_INVALID", scopeDepth: 1, isHighlighted: true },
          { name: "s2", type: "String", resourceId: "res-1", state: "OWNER", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-1", label: "\"forge\"", heapAddress: "0x30C000", currentOwner: "s2", activeBorrows: [], isDropped: false },
        ],
        activeAction: "MOVE",
      },
      {
        stepNumber: 3,
        codeLine: 3,
        codeSnippet: "// println!(\"{}\", s1); -> COMPILE ERROR: value borrowed after move",
        explanation: "Compiler Guard: Attempting to read `s1` fails at compile time with E0382: \"borrow of moved value `s1`\".",
        ruleViolated: "Rust Rule: Each value has exactly ONE owner at any given time. Once moved, the previous owner cannot be accessed.",
        variables: [
          { name: "s1", type: "String", resourceId: "res-1", state: "MOVED_INVALID", scopeDepth: 1, isHighlighted: true },
          { name: "s2", type: "String", resourceId: "res-1", state: "OWNER", scopeDepth: 1 },
        ],
        resources: [
          { id: "res-1", label: "\"forge\"", heapAddress: "0x30C000", currentOwner: "s2", activeBorrows: [], isDropped: false },
        ],
        activeAction: "MOVE",
      },
      {
        stepNumber: 4,
        codeLine: 4,
        codeSnippet: "println!(\"{}\", s2); // s2 is valid owner",
        explanation: "`s2` is the active owner. It can be safely read, passed to functions, or dropped at end of scope.",
        variables: [
          { name: "s1", type: "String", resourceId: "res-1", state: "MOVED_INVALID", scopeDepth: 1 },
          { name: "s2", type: "String", resourceId: "res-1", state: "OWNER", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-1", label: "\"forge\"", heapAddress: "0x30C000", currentOwner: "s2", activeBorrows: [], isDropped: false },
        ],
        activeAction: "DECLARE",
      },
    ],
  },
  {
    id: "rust-borrowing-rules",
    title: "Rust Borrowing (&T vs &mut T) Rules",
    description: "Visualize the Aliasing XOR Mutability rule: Many readers (`&T`) OR exactly one writer (`&mut T`).",
    code: [
      "let mut data = String::from(\"sensor\");",
      "let r1 = &data; // Immutable borrow 1",
      "let r2 = &data; // Immutable borrow 2 (Allowed: multiple readers)",
      "// let m = &mut data; -> ERROR: cannot borrow as mutable while immutably borrowed",
      "println!(\"{} {}\", r1, r2); // r1 & r2 last used here",
      "let m = &mut data; // Now allowed! Exclusive writer",
    ],
    steps: [
      {
        stepNumber: 1,
        codeLine: 1,
        codeSnippet: "let mut data = String::from(\"sensor\");",
        explanation: "`data` is declared as mutable owner of \"sensor\".",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [], isDropped: false },
        ],
        activeAction: "DECLARE",
      },
      {
        stepNumber: 2,
        codeLine: 2,
        codeSnippet: "let r1 = &data; // Immutable borrow 1",
        explanation: "`r1` takes a read-only reference (`&String`). `data` is now read-locked: it cannot be mutated or moved while `r1` is alive.",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1 },
          { name: "r1", type: "&String", resourceId: "res-2", state: "BORROWED_IMMUTABLE", borrowedFrom: "data", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [{ borrower: "r1", kind: "immutable" }], isDropped: false },
        ],
        activeAction: "BORROW_IMMUTABLE",
      },
      {
        stepNumber: 3,
        codeLine: 3,
        codeSnippet: "let r2 = &data; // Immutable borrow 2",
        explanation: "Multiple immutable references are completely allowed! Both `r1` and `r2` can read `data` simultaneously.",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1 },
          { name: "r1", type: "&String", resourceId: "res-2", state: "BORROWED_IMMUTABLE", borrowedFrom: "data", scopeDepth: 1 },
          { name: "r2", type: "&String", resourceId: "res-2", state: "BORROWED_IMMUTABLE", borrowedFrom: "data", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [{ borrower: "r1", kind: "immutable" }, { borrower: "r2", kind: "immutable" }], isDropped: false },
        ],
        activeAction: "BORROW_IMMUTABLE",
      },
      {
        stepNumber: 4,
        codeLine: 4,
        codeSnippet: "// let m = &mut data; -> COMPILE ERROR",
        explanation: "Borrow Checker Error: Rust forbids creating a mutable reference `&mut` while ANY active immutable references (`&`) exist.",
        ruleViolated: "Borrow Rule: You may have any number of immutable references (&T) OR exactly one mutable reference (&mut T), but never both at the same time.",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1 },
          { name: "r1", type: "&String", resourceId: "res-2", state: "BORROWED_IMMUTABLE", borrowedFrom: "data", scopeDepth: 1 },
          { name: "r2", type: "&String", resourceId: "res-2", state: "BORROWED_IMMUTABLE", borrowedFrom: "data", scopeDepth: 1 },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [{ borrower: "r1", kind: "immutable" }, { borrower: "r2", kind: "immutable" }], isDropped: false },
        ],
        activeAction: "BORROW_MUTABLE",
      },
      {
        stepNumber: 5,
        codeLine: 5,
        codeSnippet: "println!(\"{} {}\", r1, r2); // last use of r1, r2",
        explanation: "Non-Lexical Lifetimes (NLL): Since `r1` and `r2` are never used after this line, their borrow lifetimes end right here!",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1 },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [], isDropped: false },
        ],
        activeAction: "END_BORROW",
      },
      {
        stepNumber: 6,
        codeLine: 6,
        codeSnippet: "let m = &mut data; // Now allowed! Exclusive writer",
        explanation: "With all immutable borrows expired, `m` safely obtains EXCLUSIVE mutable access to `data`.",
        variables: [
          { name: "data", type: "mut String", resourceId: "res-2", state: "OWNER", scopeDepth: 1 },
          { name: "m", type: "&mut String", resourceId: "res-2", state: "BORROWED_MUTABLE", borrowedFrom: "data", scopeDepth: 1, isHighlighted: true },
        ],
        resources: [
          { id: "res-2", label: "\"sensor\"", heapAddress: "0x40D000", currentOwner: "data", activeBorrows: [{ borrower: "m", kind: "mutable" }], isDropped: false },
        ],
        activeAction: "BORROW_MUTABLE",
      },
    ],
  },
];

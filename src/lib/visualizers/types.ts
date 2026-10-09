export type MemoryCellType = "int" | "ptr" | "char" | "struct" | "string" | "byte";

export interface StackVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  pointsTo?: string; // Heap address if it's a pointer
  isHighlighted?: boolean;
}

export interface StackFrame {
  functionName: string;
  variables: StackVariable[];
}

export interface HeapAllocation {
  id: string;
  address: string;
  label: string;
  sizeBytes: number;
  value: string;
  allocatedBy: string;
  isFreed?: boolean;
  isHighlighted?: boolean;
}

export interface MemoryStep {
  stepNumber: number;
  codeLine: number;
  codeSnippet: string;
  explanation: string;
  stack: StackFrame[];
  heap: HeapAllocation[];
  activeAction: "PUSH_FRAME" | "ALLOC_STACK" | "ALLOC_HEAP" | "MUTATE" | "FREE_HEAP" | "POP_FRAME";
}

export interface MemoryScenario {
  id: string;
  title: string;
  track: "C01" | "C04";
  language: "c" | "rust";
  description: string;
  code: string[];
  steps: MemoryStep[];
}

export type OwnershipState = "OWNER" | "BORROWED_IMMUTABLE" | "BORROWED_MUTABLE" | "MOVED_INVALID";

export interface OwnershipVariable {
  name: string;
  type: string;
  resourceId: string;
  state: OwnershipState;
  borrowedFrom?: string;
  scopeDepth: number;
  isHighlighted?: boolean;
}

export interface ResourceItem {
  id: string;
  label: string;
  heapAddress: string;
  currentOwner: string | null;
  activeBorrows: { borrower: string; kind: "immutable" | "mutable" }[];
  isDropped: boolean;
}

export interface OwnershipStep {
  stepNumber: number;
  codeLine: number;
  codeSnippet: string;
  explanation: string;
  ruleViolated?: string;
  variables: OwnershipVariable[];
  resources: ResourceItem[];
  activeAction: "DECLARE" | "MOVE" | "BORROW_IMMUTABLE" | "BORROW_MUTABLE" | "MUTATE" | "END_BORROW" | "DROP";
}

export interface OwnershipScenario {
  id: string;
  title: string;
  description: string;
  code: string[];
  steps: OwnershipStep[];
}

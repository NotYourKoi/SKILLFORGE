import type { Metadata } from "next";
import PageHeader from "@/components/ui/page-header";
import VisualizerDeck from "@/components/visualizers/visualizer-deck";

export const metadata: Metadata = {
  title: "Interactive Systems Visualizers | SkillForge",
  description:
    "Interactive step-by-step visualizers for Stack vs Heap memory, pointer dereferencing, and Rust ownership & borrow checking.",
};

export default function VisualizersPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <PageHeader
        title="Interactive Systems Visualizers"
        description="Step through call stacks, heap allocations, and Rust borrow checker lifecycles with tactile retro controls."
      />

      <VisualizerDeck />
    </div>
  );
}

"use client";

import { useState } from "react";
import { MEMORY_SCENARIOS, OWNERSHIP_SCENARIOS } from "@/lib/visualizers/scenarios";
import MemoryVisualizer from "./memory-visualizer";
import OwnershipVisualizer from "./ownership-visualizer";

export default function VisualizerDeck({
  defaultTab = "memory",
}: {
  defaultTab?: "memory" | "ownership";
}) {
  const [activeTab, setActiveTab] = useState<"memory" | "ownership">(defaultTab);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string>(MEMORY_SCENARIOS[0].id);
  const [selectedOwnershipId, setSelectedOwnershipId] = useState<string>(OWNERSHIP_SCENARIOS[0].id);

  const activeMemoryScenario =
    MEMORY_SCENARIOS.find((s) => s.id === selectedMemoryId) || MEMORY_SCENARIOS[0];
  const activeOwnershipScenario =
    OWNERSHIP_SCENARIOS.find((s) => s.id === selectedOwnershipId) || OWNERSHIP_SCENARIOS[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Category selector tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("memory")}
          className={`border-2 border-ink px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "memory"
              ? "bg-complete text-soot shadow-[2px_2px_0px_#1e1e1e]"
              : "bg-cream text-soot/80 hover:bg-grid"
          }`}
        >
          📦 Stack vs Heap Memory
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ownership")}
          className={`border-2 border-ink px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "ownership"
              ? "bg-complete text-soot shadow-[2px_2px_0px_#1e1e1e]"
              : "bg-cream text-soot/80 hover:bg-grid"
          }`}
        >
          🦀 Rust Ownership & Borrowing
        </button>
      </div>

      {/* Scenario Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase text-soot/70">
          SELECT SCENARIO:
        </span>
        {activeTab === "memory"
          ? MEMORY_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedMemoryId(sc.id)}
                className={`border-2 border-ink px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                  selectedMemoryId === sc.id
                    ? "bg-unlocked text-cream font-black"
                    : "bg-cream text-soot hover:bg-grid"
                }`}
              >
                {sc.title}
              </button>
            ))
          : OWNERSHIP_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedOwnershipId(sc.id)}
                className={`border-2 border-ink px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                  selectedOwnershipId === sc.id
                    ? "bg-unlocked text-cream font-black"
                    : "bg-cream text-soot hover:bg-grid"
                }`}
              >
                {sc.title}
              </button>
            ))}
      </div>

      {/* Active Visualizer Render */}
      {activeTab === "memory" ? (
        <MemoryVisualizer scenario={activeMemoryScenario} />
      ) : (
        <OwnershipVisualizer scenario={activeOwnershipScenario} />
      )}
    </div>
  );
}

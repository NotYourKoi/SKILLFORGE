"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { python } from "@codemirror/lang-python";

/**
 * Isolated code editor built on CodeMirror 6. Kept as a thin, swappable
 * component so a different editor can be dropped in without touching the
 * exercise runner. The language is fixed per exercise for now.
 */
export default function CodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (value: string) => void;
  language: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const theme = EditorView.theme({
    "&": {
      backgroundColor: "#fffdf5",
      color: "#1e1e1e",
      fontSize: "14px",
      height: "100%",
    },
    ".cm-content": { fontFamily: "ui-monospace, monospace", caretColor: "#1e1e1e" },
    ".cm-gutters": {
      backgroundColor: "#f2efe4",
      color: "#8a8678",
      borderRight: "2px solid #1e1e1e",
    },
    ".cm-activeLine": { backgroundColor: "rgba(139, 205, 170, 0.25)" },
    ".cm-activeLineGutter": { backgroundColor: "rgba(139, 205, 170, 0.4)" },
    "&.cm-focused": {
      outline: "2px solid var(--color-unlocked)",
      outlineOffset: "2px",
    },
  });

  useEffect(() => {
    if (!hostRef.current) return;

    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          language === "python" ? python() : [],
          theme,
          EditorView.contentAttributes.of({ "aria-label": "Code editor" }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={hostRef}
      className="h-full min-h-64 w-full overflow-hidden border-2 border-ink bg-[#fffdf5] text-left"
    />
  );
}

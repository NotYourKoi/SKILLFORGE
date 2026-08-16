import type { ComponentType, ReactNode } from "react";
import type { ElementContent } from "hast";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkDirective from "remark-directive";
import CodeBlock from "./code-block";

type DirectiveNode = { name?: string; attributes?: Record<string, string> };

function directiveToElement(
  state: { all(node: unknown): ElementContent[] },
  node: unknown,
): { type: "element"; tagName: string; properties: Record<string, string>; children: ElementContent[] } {
  const directive = node as DirectiveNode;
  return {
    type: "element",
    tagName: directive.name ?? "div",
    properties: directive.attributes ?? {},
    children: state.all(node),
  };
}

function NoteCallout({ children }: { children?: ReactNode }) {
  return (
    <div className="my-4 flex flex-col gap-1 border-2 border-ink bg-teal p-4">
      <span className="text-xs font-black uppercase tracking-widest text-soot">
        Note
      </span>
      <div className="text-sm leading-6 text-soot/90">{children}</div>
    </div>
  );
}

function WarningCallout({ children }: { children?: ReactNode }) {
  return (
    <div className="my-4 flex flex-col gap-1 border-2 border-ink bg-danger p-4">
      <span className="text-xs font-black uppercase tracking-widest text-soot">
        Common mistake
      </span>
      <div className="text-sm leading-6 text-soot/90">{children}</div>
    </div>
  );
}

const components: Components & {
  note: ComponentType<{ children?: ReactNode }>;
  warning: ComponentType<{ children?: ReactNode }>;
} = {
  h2: ({ children }) => (
    <h2 className="mb-2 mt-8 border-b-2 border-grid pb-1 text-base font-black uppercase tracking-wide text-soot">
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="my-3 leading-7 text-soot/90">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-3 flex list-disc flex-col gap-1 pl-6 text-soot/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 flex list-decimal flex-col gap-1 pl-6 text-soot/90">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-black text-soot">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-bold text-unlocked underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-ink bg-grid px-4 py-2 leading-7 text-soot/90">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-grid" />,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    const text = String(children ?? "").replace(/\n$/, "");
    if (isBlock) {
      const language = className?.match(/language-(\w+)/)?.[1] ?? "text";
      return <CodeBlock code={text} language={language} />;
    }
    return (
      <code className="border border-ink bg-grid px-1 py-0.5 text-[0.85em] text-soot">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  note: NoteCallout,
  warning: WarningCallout,
};

export default function LessonContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkDirective]}
      remarkRehypeOptions={{
        handlers: { containerDirective: directiveToElement },
      }}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

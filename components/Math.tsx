"use client";

import katex from "katex";
import { useMemo } from "react";

/**
 * Renders a KaTeX expression. Falls back to monospace text if the model
 * returned something KaTeX cannot parse, so a bad formula never blanks a card.
 */
export function MathBlock({
  latex,
  display = true,
  className = "",
}: {
  latex: string;
  display?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        output: "html",
      });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (!html) {
    return (
      <code className="block break-words rounded-xl bg-slate-100 px-3 py-2 font-mono text-sm text-slate-700">
        {latex}
      </code>
    );
  }

  return (
    <span
      className={`katex-scope block overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// src/components/RichTextEditor.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import TurndownService from "turndown";
import { marked } from "marked";

/* ---------------- marked: GFM-like with soft breaks ---------------- */
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});

/* ---------------- Turndown + rules ---------------- */
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Keep underline <u> (Markdown has no native underline)
turndown.addRule("underline", {
  filter: ["u"],
  replacement: (content) => `<u>${content}</u>`,
});

// Ensure clean links (strip whitespace in href)
turndown.addRule("anchorNoWrap", {
  filter: (node) => node.nodeName === "A" && node.getAttribute("href"),
  replacement: (content, node) => {
    const hrefRaw = node.getAttribute("href") || "";
    const href = hrefRaw.replace(/\s+/g, "");
    const titleAttr = node.getAttribute("title");
    const title = titleAttr ? ` "${titleAttr.replace(/"/g, '\\"')}"` : "";
    return `[${content}](${href}${title})`;
  },
});

// Map <br> to Markdown hard-break
turndown.addRule("lineBreak", {
  filter: "br",
  replacement: () => "  \n",
});

// Preserve intentionally blank paragraphs
turndown.addRule("emptyParagraph", {
  filter: (node) => {
    if (node.nodeName !== "P") return false;
    const html = node.innerHTML.replace(/\s+/g, "").toLowerCase();
    return html === "" || html === "<br>";
  },
  replacement: () => "\n\n",
});

/* -------------------------------------------------------------------
   Align wrappers: mantener headings/listas si aparecen dentro
------------------------------------------------------------------- */
turndown.addRule("quillAlignClassOrStyle", {
  filter: (node) => {
    if (node.nodeType !== 1) return false;
    const el = /** @type {HTMLElement} */ (node);
    const cls = el.getAttribute("class") || "";
    const hasClass = /\bql-align-(center|right|justify)\b/.test(cls);
    const ta = (el.style && el.style.textAlign) || "";
    return hasClass || ta;
  },
  replacement: (content, node) => {
    const el = /** @type {HTMLElement} */ (node);
    const cls = el.getAttribute("class") || "";
    const classMatch = cls.match(/\bql-align-(center|right|justify)\b/);
    let align = (el.style && el.style.textAlign) || (classMatch && classMatch[1]) || "";
    align = String(align).toLowerCase();
    if (!/(center|right|justify)/.test(align)) return content;

    const tag = el.nodeName.toLowerCase();
    const blockTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "div"];
    const wrapTag = blockTags.includes(tag) ? tag : "div";

    // Avoid double-wrapping
    const open = new RegExp(`^<${wrapTag}\\s+align="${align}"[^>]*>`, "i");
    const close = new RegExp(`</${wrapTag}>$`, "i");
    if (open.test(content) && close.test(content)) {
      content = content.replace(open, "").replace(close, "");
    }

    // Si hay Markdown de BLOQUE (##, >, 1. , -, ```), render de bloque; si no, inline
    const hasBlockMd = /(^|\n)\s*(#{1,6}\s|>|\d+\.\s+|[-*+]\s+|```)/m.test(content || "");
    const innerHtml = hasBlockMd
      ? marked.parse(content || "")
      : (marked.parseInline ? marked.parseInline(content || "") : marked.parse(content || ""));

    return `<${wrapTag} align="${align}">${innerHtml}</${wrapTag}>`;
  },
});

/* ---------------- List normalization (conservadora) ---------------- */
function normalizeMarkdownLists(md = "") {
  if (!md) return "";
  // Add a blank line BEFORE valid list items following a non-empty line
  return md.replace(
    /([^\n])\n((?:\s*[-+*]\s+\S)|(?:\s*\d+\.\s+\S))/g,
    (_m, a, b) => `${a}\n\n${b}`
  );
}

/* ---------------- Collapse duplicate aligned wrappers --------------- */
function collapseDuplicateAlignedBlocks(html = "") {
  if (!html) return html;

  const nestedSameAlignRE =
    /<(p|h[1-6]|blockquote|div)\s+align="(center|right|justify)"[^>]*>\s*<(p|h[1-6]|blockquote|div)\s+align="\2"[^>]*>([\s\S]*?)<\/\3>\s*<\/\1>/gi;

  const emptyAlignedRE =
    /<(p|h[1-6]|blockquote|div)\s+align="(center|right|justify)"[^>]*>\s*<\/\1>/gi;

  let prev;
  do {
    prev = html;
    html = html.replace(nestedSameAlignRE, (_m, _outerTag, a, innerTag, inner) => {
      return `<${innerTag} align="${a}">${inner}</${innerTag}>`;
    });
    html = html.replace(emptyAlignedRE, "");
  } while (html !== prev);

  return html;
}

/* ---------------- Markdown <-> HTML ---------------- */
function mdToHtml(md = "") {
  if (!md) return "";
  return marked.parse(md);
}

function htmlToMd(html = "") {
  if (!html) return "";
  html = html.replace(/<p><br><\/p>/gi, "<p></p>");
  html = collapseDuplicateAlignedBlocks(html);
  const md = turndown.turndown(html);
  return normalizeMarkdownLists(md);
}

/* ---------------- Component ---------------- */
export default function RichTextEditor({
  valueMarkdown = "",
  onChangeMarkdown,
  height = 380,       // altura fija por defecto
  autoHeight = false, // si true, sin altura fija
  placeholder = "",
  className = "",
  debounceMs = 150,
  readOnly = false,   // ← para modo visor
  hideToolbar = false,// ← sin toolbar
  transparent = false // ← sin fondo ni bordes
}) {
  const quillRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [html, setHtml] = useState("");
  const lastEmittedMarkdownRef = useRef("");
  const debounceTimerRef = useRef(null);
  const isApplyingExternalChangeRef = useRef(false);

  const modules = useMemo(
    () => ({
      toolbar: hideToolbar
        ? false
        : {
            container: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image"],
              ["code-block"],
              [{ align: [] }],
              ["clean"],
            ],
            handlers: {
              link: function (value) {
                const quill = quillRef.current?.getEditor?.();
                if (!quill) return;
                const range = quill.getSelection(true);
                if (value) {
                  const url = window.prompt("URL del enlace:")?.trim();
                  if (url && isProbablyUrl(url)) {
                    if (range && range.length) {
                      quill.format("link", url);
                    } else {
                      quill.insertText(range.index, url, "link", url, "user");
                      quill.setSelection(range.index + url.length, 0);
                    }
                  } else if (url) {
                    window.alert("URL inválida. Debe comenzar con http(s)://");
                  }
                } else {
                  quill.format("link", false);
                }
              },
              image: function () {
                const quill = quillRef.current?.getEditor?.();
                if (!quill) return;
                const url = window.prompt("URL de la imagen:")?.trim();
                if (!url) return;
                if (!isProbablyUrl(url)) {
                  window.alert("URL inválida. Debe comenzar con http(s)://");
                  return;
                }
                const index = quill.getSelection(true)?.index ?? quill.getLength();
                quill.insertEmbed(index, "image", url, "user");
                quill.setSelection(index + 1, 0);
              },
            },
          },
      clipboard: { matchVisual: true },
      history: { delay: 400, maxStack: 200, userOnly: true },
    }),
    [hideToolbar]
  );

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "list", "bullet", "link", "image", "code-block", "align"],
    []
  );

  useEffect(() => setMounted(true), []);

  // Push external markdown → HTML into Quill
  useEffect(() => {
    const incomingHtml = mdToHtml(valueMarkdown || "");
    if (incomingHtml === html) return;
    isApplyingExternalChangeRef.current = true;
    setHtml(incomingHtml);
    lastEmittedMarkdownRef.current = valueMarkdown || "";
    const t = setTimeout(() => {
      isApplyingExternalChangeRef.current = false;
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueMarkdown]);

  const emitMarkdownChange = useCallback(
    (nextHtml) => {
      const md = htmlToMd(nextHtml || "");
      if (md === lastEmittedMarkdownRef.current) return;
      lastEmittedMarkdownRef.current = md;
      onChangeMarkdown?.(md);
    },
    [onChangeMarkdown]
  );

  const handleChange = useCallback(
    (nextHtml) => {
      setHtml(nextHtml);
      if (isApplyingExternalChangeRef.current) return;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => emitMarkdownChange(nextHtml), debounceMs);
    },
    [debounceMs, emitMarkdownChange]
  );

  useEffect(() => () => debounceTimerRef.current && clearTimeout(debounceTimerRef.current), []);

  const wrapperClasses = [
    "rounded-xl",
    "overflow-hidden",
    transparent ? "bg-transparent border-0" : "bg-neutral-900 border border-white/10",
    "flex",
    "flex-col",
    className || ""
  ].join(" ");

  const wrapperStyle = autoHeight ? undefined : { height };
  const quillStyle = autoHeight ? undefined : { height: height - 2 /* border fix */ };

  return (
    <div className={wrapperClasses} style={wrapperStyle}>
      <div className="flex-1 overflow-auto">
        {mounted ? (
          <ReactQuill
            ref={quillRef}
            theme={hideToolbar ? "bubble" : "snow"}
            value={html}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            readOnly={readOnly}
            style={quillStyle}
          />
        ) : (
          <div className="p-4 text-sm text-white/60">Cargando editor…</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function isProbablyUrl(str = "") {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

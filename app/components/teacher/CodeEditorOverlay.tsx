'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Play,
  Terminal,
  FileCode2,
  Folder,
  ChevronRight,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Bug,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  Highlighter,
  StickyNote,
  BookOpen,
  Maximize2,
  Minimize2,
  Eraser,
  Plus,
  Minus,
  ListTree,
  Trash2,
} from 'lucide-react';

/* ============================================================ */
/* CONFIG                                                       */
/* ============================================================ */

type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown';

const LANGUAGES: {
  id: Language;
  label: string;
  ext: string;
  accent: string;
}[] = [
  { id: 'javascript', label: 'JavaScript', ext: 'js', accent: 'text-amber-400' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts', accent: 'text-blue-400' },
  { id: 'python', label: 'Python', ext: 'py', accent: 'text-emerald-400' },
  { id: 'html', label: 'HTML', ext: 'html', accent: 'text-orange-400' },
  { id: 'css', label: 'CSS', ext: 'css', accent: 'text-sky-400' },
  { id: 'json', label: 'JSON', ext: 'json', accent: 'text-yellow-400' },
  { id: 'markdown', label: 'Markdown', ext: 'md', accent: 'text-fuchsia-400' },
];

const FONT_SIZES = [13, 15, 17, 20, 24, 28];

const DEFAULT_CODE: Record<Language, string> = {
  javascript: `// JavaScript Playground
// Click ▶ Run to execute — or press Ctrl+Enter

function greet(name) {
  return \`Hello, \${name}!\`;
}

const students = ["Ali", "Sara", "Ahmed"];

students.forEach((student) => {
  console.log(greet(student));
});

// Try some math
const a = 10;
const b = 20;
console.log("Sum =", a + b);`,
  typescript: `// TypeScript Playground

interface User {
  id: number;
  name: string;
}

const users: User[] = [
  { id: 1, name: "Ali" },
  { id: 2, name: "Sara" },
  { id: 3, name: "Ahmed" },
];

users.forEach((user) => {
  console.log(\`#\${user.id} — \${user.name}\`);
});`,
  python: `# Python Playground

def greet(name):
    return f"Hello, {name}!"

students = ["Ali", "Sara", "Ahmed"]

for student in students:
    print(greet(student))

print("Sum:", 10 + 20)`,
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      padding: 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      min-height: 100vh;
      margin: 0;
    }
    h1 { color: #fff; }
    button {
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      background: #fbbf24;
      color: #1e293b;
      font-weight: 700;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Hello, Student! 👋</h1>
  <p>This is a live HTML preview.</p>
  <button onclick="alert('It works!')">Click Me</button>
</body>
</html>`,
  css: `/* CSS Playground */

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: system-ui;
}`,
  json: `{
  "name": "student-app",
  "version": "1.0.0",
  "author": "Teacher",
  "dependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  }
}`,
  markdown: `# My Notes

## Chapter 1

This is a **markdown** document.

- Point one
- Point two
- Point three

> A famous quote here.

\`\`\`js
console.log("code inside markdown");
\`\`\``,
};

/* ============================================================ */
/* LESSON LIBRARY                                               */
/* ============================================================ */

type Lesson = {
  id: string;
  title: string;
  description: string;
  language: Language;
  code: string;
};

const LESSONS: Lesson[] = [
  {
    id: 'js-basics',
    title: 'JS: Variables & Math',
    description: 'Intro to variables and arithmetic',
    language: 'javascript',
    code: `// Lesson 1 — Variables & Math

const a = 10;
const b = 20;

console.log("a =", a);
console.log("b =", b);
console.log("a + b =", a + b);
console.log("a - b =", a - b);
console.log("a * b =", a * b);
console.log("a / b =", a / b);`,
  },
  {
    id: 'js-strings',
    title: 'JS: Strings',
    description: 'Text, concatenation, templates',
    language: 'javascript',
    code: `// Lesson — Strings

const name = "Ali";
const city = "Lahore";

console.log("Hello, " + name);
console.log(\`Welcome to \${city}, \${name}!\`);

const upper = name.toUpperCase();
const lower = city.toLowerCase();

console.log("Upper:", upper);
console.log("Lower:", lower);
console.log("Length:", name.length);`,
  },
  {
    id: 'js-conditionals',
    title: 'JS: If / Else',
    description: 'Decision making with conditions',
    language: 'javascript',
    code: `// Lesson — Conditionals

const marks = 75;

if (marks >= 90) {
  console.log("Grade: A+");
} else if (marks >= 80) {
  console.log("Grade: A");
} else if (marks >= 70) {
  console.log("Grade: B");
} else if (marks >= 60) {
  console.log("Grade: C");
} else {
  console.log("Grade: F");
}`,
  },
  {
    id: 'js-loops',
    title: 'JS: Loops',
    description: 'for loop, while loop',
    language: 'javascript',
    code: `// Lesson — Loops

console.log("--- for loop ---");
for (let i = 1; i <= 5; i++) {
  console.log("Number:", i);
}

console.log("--- while loop ---");
let n = 5;
while (n > 0) {
  console.log("Countdown:", n);
  n--;
}
console.log("Liftoff!");`,
  },
  {
    id: 'js-functions',
    title: 'JS: Functions',
    description: 'Reusable code blocks',
    language: 'javascript',
    code: `// Lesson — Functions

function add(a, b) {
  return a + b;
}

function multiply(a, b) {
  return a * b;
}

function greet(name) {
  return \`Assalam-o-Alaikum, \${name}!\`;
}

console.log(add(5, 3));
console.log(multiply(4, 7));
console.log(greet("Ali"));`,
  },
  {
    id: 'js-arrays',
    title: 'JS: Arrays',
    description: 'Lists and iteration',
    language: 'javascript',
    code: `// Lesson — Arrays

const fruits = ["Apple", "Banana", "Mango", "Orange"];

console.log("First:", fruits[0]);
console.log("Last:", fruits[fruits.length - 1]);
console.log("Total:", fruits.length);

console.log("--- All fruits ---");
fruits.forEach((fruit, i) => {
  console.log(\`\${i + 1}. \${fruit}\`);
});

const upper = fruits.map(f => f.toUpperCase());
console.log("Upper:", upper);`,
  },
  {
    id: 'py-basics',
    title: 'Python: Basics',
    description: 'Variables and print',
    language: 'python',
    code: `# Lesson — Python Basics

name = "Ali"
age = 15
city = "Lahore"

print("Name:", name)
print("Age:", age)
print("City:", city)
print("Sum:", 10 + 20)`,
  },
  {
    id: 'py-loops',
    title: 'Python: Loops',
    description: 'for loop in Python',
    language: 'python',
    code: `# Lesson — Python Loops

print("--- for loop ---")
for i in range(1, 6):
    print("Number:", i)

print("--- countdown ---")
for n in range(5, 0, -1):
    print("Countdown:", n)
print("Liftoff!")`,
  },
  {
    id: 'html-page',
    title: 'HTML: First Page',
    description: 'Basic structure & text',
    language: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 24px; background: #f1f5f9; }
    h1 { color: #1e40af; }
    p { color: #334155; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>My First Web Page</h1>
  <p>Hello! This is my first HTML page.</p>
  <p>I am learning web development.</p>
</body>
</html>`,
  },
  {
    id: 'html-form',
    title: 'HTML: A Form',
    description: 'Inputs and buttons',
    language: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 24px; background: #f8fafc; }
    input, button { padding: 10px; margin: 4px 0; border-radius: 8px; border: 1px solid #cbd5e1; width: 100%; max-width: 300px; display: block; }
    button { background: #4f46e5; color: white; border: none; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Student Form</h2>
  <input type="text" placeholder="Name" />
  <input type="number" placeholder="Age" />
  <input type="email" placeholder="Email" />
  <button onclick="alert('Submitted!')">Submit</button>
</body>
</html>`,
  },
  {
    id: 'css-box',
    title: 'CSS: Box Model',
    description: 'Padding, margin, border',
    language: 'css',
    code: `/* Lesson — CSS Box Model */

.box {
  width: 200px;
  height: 100px;
  padding: 20px;
  margin: 16px;
  border: 4px solid #4f46e5;
  background: #e0e7ff;
  box-sizing: border-box;
  border-radius: 12px;
}`,
  },
  {
    id: 'css-flex',
    title: 'CSS: Flexbox',
    description: 'Modern layout basics',
    language: 'css',
    code: `/* Lesson — Flexbox */

.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #f1f5f9;
}

.card {
  flex: 1;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}`,
  },
];

/* ============================================================ */
/* SYNTAX TOKENIZER                                             */
/* ============================================================ */

type Token = { text: string; cls: string };

const KEYWORDS: Record<Language, string[]> = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'extends', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw',
    'typeof', 'instanceof', 'import', 'from', 'export', 'default', 'null',
    'undefined', 'true', 'false', 'of', 'in', 'break', 'continue', 'switch',
    'case', 'do', 'yield', 'delete',
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'class', 'extends', 'new', 'this', 'async', 'await', 'try', 'catch', 'throw',
    'typeof', 'instanceof', 'import', 'from', 'export', 'default', 'null',
    'undefined', 'true', 'false', 'of', 'in', 'break', 'continue', 'switch',
    'case', 'do', 'interface', 'type', 'enum', 'implements', 'public', 'private',
    'protected', 'readonly', 'as', 'namespace', 'declare', 'abstract',
  ],
  python: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import',
    'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield',
    'pass', 'break', 'continue', 'global', 'nonlocal', 'assert', 'del', 'in',
    'is', 'not', 'and', 'or', 'None', 'True', 'False', 'async', 'await', 'print',
  ],
  html: [],
  css: [],
  json: ['true', 'false', 'null'],
  markdown: [],
};

function tokenizeLine(line: string, lang: Language): Token[] {
  const tokens: Token[] = [];
  const kws = KEYWORDS[lang] || [];

  if (lang === 'javascript' || lang === 'typescript') {
    const m = line.match(/^(\s*\/\/.*)$/);
    if (m) return [{ text: m[1], cls: 'text-slate-500 italic' }];
  }
  if (lang === 'python') {
    const m = line.match(/^(\s*#.*)$/);
    if (m) return [{ text: m[1], cls: 'text-slate-500 italic' }];
  }
  if (lang === 'css') {
    const m = line.match(/^(\s*\/\*.*\*\/\s*)$/);
    if (m) return [{ text: m[1], cls: 'text-slate-500 italic' }];
  }

  if (lang === 'html') {
    const parts = line.split(/(<[^>]+>)/);
    parts.forEach((p) => {
      if (p.startsWith('<')) tokens.push({ text: p, cls: 'text-sky-400' });
      else if (p) tokens.push({ text: p, cls: 'text-white/70' });
    });
    return tokens;
  }

  if (lang === 'markdown') {
    if (/^#{1,6}\s/.test(line))
      return [{ text: line, cls: 'text-fuchsia-400 font-bold' }];
    if (/^>\s/.test(line))
      return [{ text: line, cls: 'text-emerald-300 italic' }];
    if (/^[-*]\s/.test(line))
      return [{ text: line, cls: 'text-sky-300' }];
    if (/^```/.test(line))
      return [{ text: line, cls: 'text-amber-400' }];
    return [{ text: line, cls: 'text-white/80' }];
  }

  if (lang === 'css') {
    const m = line.match(/^(\s*)([a-zA-Z-]+)(\s*:\s*)(.+?)(;?\s*)$/);
    if (m) {
      return [
        { text: m[1], cls: '' },
        { text: m[2], cls: 'text-sky-300' },
        { text: m[3], cls: 'text-white/50' },
        { text: m[4], cls: 'text-emerald-300' },
        { text: m[5], cls: 'text-white/50' },
      ];
    }
    return [{ text: line, cls: 'text-white/80' }];
  }

  if (lang === 'json') {
    const m = line.match(/^(\s*)("[^"]*")(\s*:\s*)(.*?)(,?\s*)$/);
    if (m) {
      return [
        { text: m[1], cls: '' },
        { text: m[2], cls: 'text-sky-300' },
        { text: m[3], cls: 'text-white/50' },
        {
          text: m[4],
          cls: /^["]/.test(m[4]) ? 'text-emerald-300' : 'text-orange-400',
        },
        { text: m[5], cls: 'text-white/50' },
      ];
    }
    return [{ text: line, cls: 'text-white/80' }];
  }

  const re =
    /(\s+)|(\/\/.*|#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([{}()[\];,.:?!<>=+\-*/%&|^~@#]+)|(.)/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const [, space, comment, str, num, ident, punct, other] = m;
    if (space) tokens.push({ text: space, cls: '' });
    else if (comment)
      tokens.push({ text: comment, cls: 'text-slate-500 italic' });
    else if (str) tokens.push({ text: str, cls: 'text-emerald-400' });
    else if (num) tokens.push({ text: num, cls: 'text-orange-400' });
    else if (ident) {
      if (kws.includes(ident))
        tokens.push({ text: ident, cls: 'text-fuchsia-400 font-semibold' });
      else if (ident === 'console' || ident === 'print')
        tokens.push({ text: ident, cls: 'text-amber-300' });
      else if (['true', 'false', 'null', 'undefined', 'None', 'True', 'False'].includes(ident))
        tokens.push({ text: ident, cls: 'text-amber-400' });
      else tokens.push({ text: ident, cls: 'text-white/85' });
    } else if (punct) tokens.push({ text: punct, cls: 'text-sky-300' });
    else if (other) tokens.push({ text: other, cls: 'text-white/70' });
  }

  return tokens;
}

/* ============================================================ */
/* JS RUNNER + VARIABLE INSPECTOR                               */
/* ============================================================ */

function fmtVal(a: any): string {
  if (typeof a === 'string') return a;
  if (typeof a === 'number' || typeof a === 'boolean') return String(a);
  if (a === null) return 'null';
  if (a === undefined) return 'undefined';
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

function runJavaScript(code: string): { logs: string[]; vars: { name: string; value: string; type: string }[] } {
  const logs: string[] = [];
  const original = console.log;
  console.log = (...args: any[]) => {
    logs.push(args.map(fmtVal).join(' '));
  };
  try {
    // eslint-disable-next-line no-new-func
    new Function(code)();
  } catch (e: any) {
    logs.push(`❌ Error: ${e?.message || String(e)}`);
  } finally {
    console.log = original;
  }
  if (logs.length === 0) logs.push('// No output');

  // Extract top-level variables (simple regex + eval)
  const vars: { name: string; value: string; type: string }[] = [];
  const seen = new Set<string>();
  const varRe = /(?:^|\n)\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g;
  let match: RegExpExecArray | null;
  while ((match = varRe.exec(code)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const expr = match[2].trim();
    try {
      // eslint-disable-next-line no-new-func
      const val = new Function(`return (${expr});`)();
      vars.push({
        name,
        value: fmtVal(val),
        type: Array.isArray(val) ? 'array' : typeof val,
      });
    } catch {
      vars.push({ name, value: expr, type: 'unknown' });
    }
  }
  return { logs, vars };
}

/* ============================================================ */
/* COMPONENT                                                    */
/* ============================================================ */

export default function CodeEditorOverlay({
  onClose,
  initialLanguage = 'javascript',
  initialCode,
}: {
  onClose: () => void;
  initialLanguage?: Language;
  initialCode?: string;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState(
    initialCode ?? DEFAULT_CODE[initialLanguage]
  );
  const [fileName, setFileName] = useState(
    `main.${LANGUAGES.find((l) => l.id === initialLanguage)?.ext || 'js'}`
  );

  const [showExplorer, setShowExplorer] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [outputTab, setOutputTab] = useState<'console' | 'preview' | 'variables'>('console');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [variables, setVariables] = useState<
    { name: string; value: string; type: string }[]
  >([]);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const [fontSizeIdx, setFontSizeIdx] = useState(2); // default = 17
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set());
  const [presentMode, setPresentMode] = useState(false);

  const [leftTab, setLeftTab] = useState<'files' | 'lessons' | 'notes'>('files');
  const [notes, setNotes] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  const fontSize = FONT_SIZES[fontSizeIdx];
  const lineHeight = Math.round(fontSize * 1.55);
  const lines = useMemo(() => code.split('\n'), [code]);
  const langMeta = LANGUAGES.find((l) => l.id === language);

  /* ---------- Autosave code + notes ---------- */

  useEffect(() => {
    const saved = localStorage.getItem(`ide-code-${language}`);
    if (saved) setCode(saved);
  }, []); // eslint-disable-line

  useEffect(() => {
    localStorage.setItem(`ide-code-${language}`, code);
  }, [code, language]);

  useEffect(() => {
    const saved = localStorage.getItem('ide-notes');
    if (saved) setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('ide-notes', notes);
  }, [notes]);

  /* ---------- Scroll sync ---------- */

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const top = textareaRef.current.scrollTop;
    const left = textareaRef.current.scrollLeft;
    if (preRef.current) {
      preRef.current.scrollTop = top;
      preRef.current.scrollLeft = left;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = top;
    if (highlightLayerRef.current) highlightLayerRef.current.scrollTop = top;
  };

  /* ---------- Editor key handling ---------- */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = ta;

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!e.shiftKey) {
        const next = value.slice(0, s) + '  ' + value.slice(en);
        setCode(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + 2;
        });
      } else {
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        const lineStr = value.slice(lineStart, s);
        if (/^  /.test(lineStr)) {
          const next =
            value.slice(0, lineStart) + lineStr.slice(2) + value.slice(s);
          setCode(next);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = Math.max(lineStart, s - 2);
          });
        }
      }
      return;
    }

    if (e.key === 'Enter') {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const currentLine = value.slice(lineStart, s);
      const indent = (currentLine.match(/^(\s*)/) || ['', ''])[1];
      const extra = /[{[(]\s*$/.test(currentLine) ? '  ' : '';
      if (indent || extra) {
        e.preventDefault();
        const insert = '\n' + indent + extra;
        const next = value.slice(0, s) + insert + value.slice(en);
        setCode(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = s + insert.length;
        });
      }
      return;
    }

    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };
    if (pairs[e.key]) {
      e.preventDefault();
      const next = value.slice(0, s) + pairs[e.key] + value.slice(en);
      setCode(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 1;
      });
    }
  };

  /* ---------- Toggle line highlight ---------- */

  const toggleLineHighlight = (lineNum: number) => {
    setHighlightedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineNum)) next.delete(lineNum);
      else next.add(lineNum);
      return next;
    });
  };

  /* ---------- Run ---------- */

  const handleRun = () => {
    setIsRunning(true);
    setShowOutput(true);

    if (language === 'html') {
      setHtmlPreview(code);
      setOutputTab('preview');
    } else if (language === 'javascript' || language === 'typescript') {
      let jsCode = code;
      if (language === 'typescript') {
        jsCode = code
          .replace(/interface\s+\w+\s*{[^}]*}/g, '')
          .replace(/:\s*[A-Za-z_$][\w$<>,\[\]\s|]*/g, '')
          .replace(/<[A-Za-z_$][\w$]*>/g, '');
      }
      const { logs, vars } = runJavaScript(jsCode);
      setConsoleLogs(logs);
      setVariables(vars);
      setOutputTab(vars.length > 0 ? 'variables' : 'console');
    } else if (language === 'python') {
      const logs: string[] = [];
      const vars: { name: string; value: string; type: string }[] = [];
      const localVars: Record<string, any> = {};
      const pyLines = code.split('\n');
      try {
        for (const rawLine of pyLines) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const m = line.match(/^print\((.*)\)$/);
          if (m) {
            let expr = m[1].trim();
            expr = expr.replace(/f?["'](.*)["']/g, (_: string, inner: string) =>
              inner.replace(/\{(\w+)\}/g, (_2: string, v: string) =>
                localVars[v] !== undefined ? String(localVars[v]) : `{${v}}`
              )
            );
            Object.keys(localVars).forEach((v) => {
              expr = expr.replace(
                new RegExp(`\\b${v}\\b`, 'g'),
                JSON.stringify(localVars[v])
              );
            });
            try {
              // eslint-disable-next-line no-new-func
              const val = new Function(`return (${expr});`)();
              logs.push(String(val));
            } catch {
              logs.push(expr.replace(/["']/g, ''));
            }
          } else {
            const assign = line.match(/^(\w+)\s*=\s*(.+)$/);
            if (assign) {
              try {
                // eslint-disable-next-line no-new-func
                localVars[assign[1]] = new Function(`return (${assign[2]});`)();
              } catch {
                localVars[assign[1]] = assign[2];
              }
            }
          }
        }
        Object.entries(localVars).forEach(([k, v]) =>
          vars.push({ name: k, value: fmtVal(v), type: typeof v })
        );
      } catch (e: any) {
        logs.push(`❌ ${e?.message || e}`);
      }
      if (logs.length === 0) logs.push('// No output');
      setConsoleLogs(logs);
      setVariables(vars);
      setOutputTab(vars.length > 0 ? 'variables' : 'console');
    } else {
      setConsoleLogs([`// ${language} execution not supported`]);
      setOutputTab('console');
    }

    setTimeout(() => setIsRunning(false), 250);
  };

  /* ---------- Reset ---------- */

  const handleReset = () => {
    if (confirm('Reset code to default? Your current code will be lost.')) {
      setCode(DEFAULT_CODE[language]);
      setConsoleLogs([]);
      setVariables([]);
      setHtmlPreview('');
      setHighlightedLines(new Set());
    }
  };

  const handleClearOutput = () => {
    setConsoleLogs([]);
    setVariables([]);
    setHtmlPreview('');
  };

  /* ---------- Copy ---------- */

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleCopyOutput = async () => {
    try {
      const text = consoleLogs.join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1500);
    } catch {}
  };

  /* ---------- Download ---------- */

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Language switch ---------- */

  const handleLanguageChange = (lang: Language) => {
    localStorage.setItem(`ide-code-${language}`, code);
    const saved = localStorage.getItem(`ide-code-${lang}`);
    setLanguage(lang);
    setCode(saved ?? DEFAULT_CODE[lang]);
    const ext = LANGUAGES.find((l) => l.id === lang)?.ext || 'txt';
    setFileName(`main.${ext}`);
    setConsoleLogs([]);
    setVariables([]);
    setHtmlPreview('');
    setHighlightedLines(new Set());
  };

  /* ---------- Load lesson ---------- */

  const handleLoadLesson = (lesson: Lesson) => {
    if (code.trim() && !confirm('Replace current code with this lesson?')) return;
    setLanguage(lesson.language);
    setCode(lesson.code);
    const ext = LANGUAGES.find((l) => l.id === lesson.language)?.ext || 'js';
    setFileName(`main.${ext}`);
    setConsoleLogs([]);
    setVariables([]);
    setHighlightedLines(new Set());
    setLeftTab('files');
  };

  /* ---------- Font size ---------- */

  const increaseFont = () =>
    setFontSizeIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1));
  const decreaseFont = () => setFontSizeIdx((i) => Math.max(0, i - 1));

  /* ---------- Keyboard ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (presentMode) setPresentMode(false);
        else onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        increaseFont();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        decreaseFont();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, presentMode]); // eslint-disable-line

  /* ============================================================
     PRESENT MODE
     ============================================================ */

  if (presentMode) {
    return (
      <div className="fixed inset-0 z-[10000] bg-[#0b1220] flex flex-col">
        <div className="shrink-0 h-10 flex items-center justify-between px-3 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className={`h-6 w-6 rounded-md bg-white/5 flex items-center justify-center ${langMeta?.accent}`}>
              <FileCode2 className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-bold text-white/70">{fileName}</p>
            <span className="hidden sm:block text-[10px] font-mono text-white/30">— Present Mode</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-md px-1">
              <button
                type="button"
                onClick={decreaseFont}
                disabled={fontSizeIdx === 0}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-mono font-bold text-white/70 min-w-[28px] text-center">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={increaseFont}
                disabled={fontSizeIdx === FONT_SIZES.length - 1}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleRun}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-lg shadow-emerald-500/25 transition"
            >
              <Play className="h-3 w-3 fill-current" />
              Run
            </button>
            <button
              type="button"
              onClick={() => setPresentMode(false)}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[11px] font-semibold transition"
            >
              <Minimize2 className="h-3 w-3" />
              Exit
            </button>
          </div>
        </div>

        {/* Split: code top, output bottom */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Code */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-[#0b1220]">
            <div className="absolute inset-0 flex">
              <div
                className="shrink-0 bg-[#0b1220] border-r border-white/5 overflow-hidden select-none"
                style={{ width: 64 }}
              >
                <div
                  className="py-4 font-mono"
                  style={{ fontSize, lineHeight: `${lineHeight}px` }}
                >
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-end pr-3 ${
                        highlightedLines.has(i + 1)
                          ? 'text-amber-400 font-bold'
                          : 'text-white/25'
                      }`}
                      style={{ height: lineHeight }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative flex-1 min-w-0">
                <pre
                  className="absolute inset-0 m-0 px-5 py-4 font-mono overflow-hidden pointer-events-none whitespace-pre"
                  style={{ fontSize, lineHeight: `${lineHeight}px` }}
                >
                  {lines.map((line, i) => (
                    <div key={i} style={{ height: lineHeight }}>
                      {tokenizeLine(line, language).length === 0 ? (
                        <span>{'\u00A0'}</span>
                      ) : (
                        tokenizeLine(line, language).map((t, j) => (
                          <span key={j} className={t.cls}>
                            {t.text}
                          </span>
                        ))
                      )}
                    </div>
                  ))}
                </pre>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  wrap="off"
                  className="absolute inset-0 w-full h-full px-5 py-4 bg-transparent text-transparent caret-white font-mono resize-none outline-none whitespace-pre overflow-auto"
                  style={{
                    fontSize,
                    lineHeight: `${lineHeight}px`,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    caretColor: '#7dd3fc',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="shrink-0 h-[38%] min-h-[180px] border-t border-white/5 bg-[#0f172a] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
              <Terminal className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Output
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4 font-mono" style={{ fontSize: fontSize - 2, lineHeight: 1.6 }}>
              {language === 'html' && htmlPreview ? (
                <iframe
                  title="preview"
                  srcDoc={htmlPreview}
                  className="w-full h-full bg-white rounded-lg"
                  sandbox="allow-scripts allow-modals"
                />
              ) : consoleLogs.length === 0 ? (
                <p className="text-white/30">
                  Press{' '}
                  <span className="text-emerald-400 font-semibold">▶ Run</span>{' '}
                  or <kbd className="px-1.5 rounded bg-white/10">Ctrl+Enter</kbd>
                </p>
              ) : (
                consoleLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 py-0.5">
                    <span className="text-sky-500/60 select-none shrink-0 w-6 text-right">
                      {i + 1}
                    </span>
                    <span
                      className={
                        log.startsWith('❌') ? 'text-rose-400' : 'text-emerald-300'
                      }
                    >
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     NORMAL MODE
     ============================================================ */

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0b1220] flex flex-col">
      {/* ============================================
          TITLE BAR
      ============================================ */}
      <div className="shrink-0 h-12 flex items-center justify-between gap-2 px-3 bg-[#0f172a] border-b border-white/5">
        {/* Left: Logo + file tab */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <FileCode2 className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold text-white/80 hidden sm:block">
              Code Editor
            </p>
          </div>

          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <span
              className={`h-2 w-2 rounded-full bg-current ${langMeta?.accent}`}
            />
            <p className="text-[11px] font-mono text-white/70">{fileName}</p>
          </div>
        </div>

        {/* Center: actions */}
        <div className="flex items-center gap-1.5">
          {/* Language select */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="h-8 px-2 rounded-md bg-white/5 border border-white/10 text-[11px] font-semibold text-white/80 focus:outline-none focus:border-sky-400/60 cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900">
                {l.label}
              </option>
            ))}
          </select>

          {/* Font size */}
          <div className="hidden sm:flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-md px-1 h-8">
            <button
              type="button"
              onClick={decreaseFont}
              disabled={fontSizeIdx === 0}
              title="Smaller font (Ctrl -)"
              className="inline-flex items-center justify-center h-6 w-6 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-white/70 min-w-[34px] justify-center">
              <Type className="h-3 w-3" />
              {fontSize}
            </span>
            <button
              type="button"
              onClick={increaseFont}
              disabled={fontSizeIdx === FONT_SIZES.length - 1}
              title="Bigger font (Ctrl +)"
              className="inline-flex items-center justify-center h-6 w-6 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Run */}
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            title="Run (Ctrl+Enter)"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-60 transition"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span className="hidden sm:inline">Run</span>
          </button>

          {/* Present mode */}
          <button
            type="button"
            onClick={() => setPresentMode(true)}
            title="Present Mode (bigger fonts)"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Present</span>
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to default"
            className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code"
            className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download file"
            className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={() => setShowExplorer((v) => !v)}
            title="Toggle sidebar"
            className="hidden lg:inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            {showExplorer ? (
              <PanelLeftClose className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================
          MAIN GRID
      ============================================ */}
      <div className="flex-1 min-h-0 flex">
        {/* LEFT SIDEBAR */}
        {showExplorer && (
          <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#0f172a] border-r border-white/5">
            {/* Tabs */}
            <div className="shrink-0 flex border-b border-white/5">
              <SidebarTab
                active={leftTab === 'files'}
                onClick={() => setLeftTab('files')}
                icon={<Folder className="h-3.5 w-3.5" />}
                label="Files"
              />
              <SidebarTab
                active={leftTab === 'lessons'}
                onClick={() => setLeftTab('lessons')}
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Lessons"
              />
              <SidebarTab
                active={leftTab === 'notes'}
                onClick={() => setLeftTab('notes')}
                icon={<StickyNote className="h-3.5 w-3.5" />}
                label="Notes"
              />
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {leftTab === 'files' && (
                <div className="p-2 space-y-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-white/60">
                    <ChevronRight className="h-3 w-3 rotate-90" />
                    <Folder className="h-3.5 w-3.5 text-sky-400" />
                    <span className="font-semibold">src</span>
                  </div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-1.5 pl-7 rounded-md bg-white/5 border border-white/10 text-left"
                  >
                    <FileCode2
                      className={`h-3.5 w-3.5 ${langMeta?.accent}`}
                    />
                    <span className="text-[11px] font-mono text-white/80 truncate">
                      {fileName}
                    </span>
                  </button>

                  <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                    <p className="px-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Shortcuts
                    </p>
                    <div className="px-2 space-y-1 text-[10px] text-white/50 leading-relaxed">
                      <ShortcutRow keys={['Ctrl', '↵']} label="Run code" />
                      <ShortcutRow keys={['Ctrl', '+']} label="Bigger font" />
                      <ShortcutRow keys={['Ctrl', '-']} label="Smaller font" />
                      <ShortcutRow keys={['Tab']} label="Indent" />
                      <ShortcutRow keys={['Shift', 'Tab']} label="Outdent" />
                      <ShortcutRow keys={['Esc']} label="Close" />
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                    <p className="px-2 text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                      <Highlighter className="h-3 w-3" />
                      Line Highlights
                    </p>
                    <p className="px-2 text-[10px] text-white/40 leading-relaxed">
                      Click on any line number to highlight it. Great for pointing at specific lines while teaching.
                    </p>
                    {highlightedLines.size > 0 && (
                      <div className="px-2 flex flex-wrap gap-1">
                        {[...highlightedLines].sort((a, b) => a - b).map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono font-bold"
                          >
                            L{n}
                            <button
                              type="button"
                              onClick={() => toggleLineHighlight(n)}
                              className="text-amber-300/70 hover:text-amber-300"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => setHighlightedLines(new Set())}
                          className="text-[10px] text-white/40 hover:text-white/70"
                        >
                          clear all
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {leftTab === 'lessons' && (
                <div className="p-2 space-y-1.5">
                  <p className="px-2 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                    Ready-to-Teach Lessons
                  </p>
                  {LESSONS.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleLoadLesson(lesson)}
                      className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            lesson.language === 'python'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : lesson.language === 'javascript' ||
                                lesson.language === 'typescript'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-sky-500/15 text-sky-300'
                          }`}
                        >
                          {lesson.language}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-white/85 group-hover:text-white">
                        {lesson.title}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {lesson.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {leftTab === 'notes' && (
                <div className="flex flex-col h-full p-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                      Teacher Notes
                    </p>
                    {notes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNotes('')}
                        className="text-[10px] text-white/40 hover:text-rose-400 flex items-center gap-1"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write teaching notes, key points, or hints here..."
                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-lg p-3 text-[11px] text-white/85 placeholder:text-white/25 outline-none focus:border-sky-400/50 resize-none leading-relaxed"
                  />
                  <p className="px-2 pt-2 text-[9px] text-white/30">
                    Saved automatically · visible only to you
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* EDITOR + OUTPUT */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Editor */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-[#0b1220]">
            <div className="absolute inset-0 flex">
              {/* Gutter — clickable line numbers */}
              <div
                ref={gutterRef}
                className="shrink-0 bg-[#0b1220] border-r border-white/5 overflow-hidden select-none"
                style={{ width: Math.max(56, fontSize * 3.2) }}
              >
                <div
                  className="py-3 font-mono"
                  style={{ fontSize, lineHeight: `${lineHeight}px` }}
                >
                  {lines.map((_, i) => {
                    const n = i + 1;
                    const isHl = highlightedLines.has(n);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleLineHighlight(n)}
                        title={`${isHl ? 'Remove' : 'Add'} highlight on line ${n}`}
                        className={`w-full flex items-center justify-end pr-3 cursor-pointer transition-colors ${
                          isHl
                            ? 'text-amber-400 font-bold bg-amber-400/10'
                            : 'text-white/25 hover:text-white/60 hover:bg-white/5'
                        }`}
                        style={{ height: lineHeight }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code area */}
              <div className="relative flex-1 min-w-0">
                {/* Highlight overlay for full-line highlight */}
                <div
                  ref={highlightLayerRef}
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                >
                  <div className="py-3">
                    {lines.map((_, i) => {
                      const n = i + 1;
                      return (
                        <div
                          key={i}
                          style={{ height: lineHeight }}
                          className={
                            highlightedLines.has(n)
                              ? 'bg-amber-400/10 border-l-2 border-amber-400'
                              : ''
                          }
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Highlight layer */}
                <pre
                  ref={preRef}
                  aria-hidden
                  className="absolute inset-0 m-0 px-4 py-3 font-mono overflow-hidden pointer-events-none whitespace-pre"
                  style={{ fontSize, lineHeight: `${lineHeight}px` }}
                >
                  {lines.map((line, i) => {
                    const tokens = tokenizeLine(line, language);
                    return (
                      <div key={i} style={{ height: lineHeight }}>
                        {tokens.length === 0 ? (
                          <span>{'\u00A0'}</span>
                        ) : (
                          tokens.map((t, j) => (
                            <span key={j} className={t.cls}>
                              {t.text}
                            </span>
                          ))
                        )}
                      </div>
                    );
                  })}
                  {'\n'}
                </pre>

                {/* Editable textarea */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onScroll={handleScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  wrap="off"
                  className="absolute inset-0 w-full h-full px-4 py-3 bg-transparent text-transparent caret-white font-mono resize-none outline-none whitespace-pre overflow-auto"
                  style={{
                    fontSize,
                    lineHeight: `${lineHeight}px`,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    caretColor: '#7dd3fc',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Output panel */}
          {showOutput && (
            <div className="shrink-0 h-64 border-t border-white/5 bg-[#0f172a] flex flex-col">
              {/* Tabs */}
              <div className="flex items-center gap-1 px-3 pt-2 border-b border-white/5">
                <OutputTab
                  active={outputTab === 'console'}
                  onClick={() => setOutputTab('console')}
                  icon={<Terminal className="h-3.5 w-3.5" />}
                  label="Console"
                  count={consoleLogs.length}
                  accent="sky"
                />
                {language === 'html' && (
                  <OutputTab
                    active={outputTab === 'preview'}
                    onClick={() => setOutputTab('preview')}
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                    label="Preview"
                    accent="emerald"
                  />
                )}
                {variables.length > 0 && (
                  <OutputTab
                    active={outputTab === 'variables'}
                    onClick={() => setOutputTab('variables')}
                    icon={<ListTree className="h-3.5 w-3.5" />}
                    label="Variables"
                    count={variables.length}
                    accent="violet"
                  />
                )}

                <div className="ml-auto flex items-center gap-2 pr-2">
                  {consoleLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCopyOutput}
                      title="Copy output"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-white/80 transition"
                    >
                      {copiedOutput ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  )}
                  {(consoleLogs.length > 0 || variables.length > 0) && (
                    <button
                      type="button"
                      onClick={handleClearOutput}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-rose-400 transition"
                    >
                      <Eraser className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOutput(false)}
                    className="inline-flex items-center justify-center h-6 w-6 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition"
                    title="Hide output"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-auto">
                {outputTab === 'preview' && language === 'html' ? (
                  <iframe
                    title="preview"
                    srcDoc={htmlPreview || code}
                    className="w-full h-full bg-white"
                    sandbox="allow-scripts allow-modals"
                  />
                ) : outputTab === 'variables' ? (
                  <div className="p-3 space-y-1.5">
                    {variables.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 min-w-[60px] pt-0.5">
                          {v.type}
                        </span>
                        <span className="font-mono text-[12px] font-bold text-amber-300 min-w-[80px]">
                          {v.name}
                        </span>
                        <span className="font-mono text-[12px] text-emerald-300 flex-1 min-w-0 break-all">
                          {v.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 font-mono text-[12px] leading-relaxed">
                    {consoleLogs.length === 0 ? (
                      <p className="text-white/30">
                        Click{' '}
                        <span className="text-emerald-400 font-semibold">
                          ▶ Run
                        </span>{' '}
                        or press{' '}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          Ctrl+Enter
                        </kbd>{' '}
                        to execute.
                      </p>
                    ) : (
                      consoleLogs.map((log, i) => (
                        <div key={i} className="flex items-start gap-3 py-0.5">
                          <span className="text-sky-500/60 select-none shrink-0 w-6 text-right">
                            {i + 1}
                          </span>
                          <span
                            className={
                              log.startsWith('❌')
                                ? 'text-rose-400'
                                : 'text-emerald-300'
                            }
                          >
                            {log}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="shrink-0 h-7 flex items-center justify-between gap-3 px-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white text-[10px] font-semibold">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3" />
                {language.charAt(0).toUpperCase() + language.slice(1)}
              </span>
              <span className="opacity-70 hidden sm:inline">
                Ln {lines.length}, Col {code.split('\n').pop()?.length || 1}
              </span>
              {highlightedLines.size > 0 && (
                <span className="hidden md:inline-flex items-center gap-1 opacity-90">
                  <Highlighter className="h-3 w-3" />
                  {highlightedLines.size} highlighted
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">
                {lines.length} line{lines.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Bug className="h-3 w-3" /> UTF-8
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SUB COMPONENTS                                               */
/* ============================================================ */

function SidebarTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold uppercase tracking-wider transition border-b-2 ${
        active
          ? 'text-sky-300 border-sky-400 bg-white/5'
          : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

function OutputTab({
  active,
  onClick,
  icon,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  accent: 'sky' | 'emerald' | 'violet';
}) {
  const borderMap = {
    sky: 'border-sky-400',
    emerald: 'border-emerald-400',
    violet: 'border-violet-400',
  } as const;
  const badgeMap = {
    sky: 'bg-sky-500/20 text-sky-300',
    emerald: 'bg-emerald-500/20 text-emerald-300',
    violet: 'bg-violet-500/20 text-violet-300',
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-t-md text-[11px] font-bold transition ${
        active
          ? `bg-[#0b1220] text-white border-t-2 ${borderMap[accent]}`
          : 'text-white/50 hover:text-white/80'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`ml-1 px-1.5 rounded-full ${badgeMap[accent]} text-[9px] font-bold`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-white/70"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
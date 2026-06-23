export const initialState = {
  layout: "editor",
  sidebarVisible: true,
  chatVisible: true,
  activeView: "explorer",
  activeTab: "app.ts",
  activeFile: "src/app.ts",
  activeConversation: 0,
  settingsSection: "rules-skills-subagents",
  composerMode: "agent",
  composerText: "",
  mentionsOpen: false,
  mentionHighlight: 0,

  models: [
    { id: "claude-sonnet", label: "claude-4-sonnet", provider: "Anthropic" },
    { id: "claude-opus", label: "claude-4-opus", provider: "Anthropic" },
    { id: "gpt-4o", label: "gpt-4o", provider: "OpenAI" },
    { id: "o3", label: "o3", provider: "OpenAI" },
    { id: "cursor-small", label: "cursor-small", provider: "Cursor" },
  ],
  selectedModel: "claude-sonnet",

  settings: {
    temperature: 0.7,
    maxTokens: 8192,
    streaming: true,
    autoApply: false,
    codebaseIndexing: true,
    webSearch: false,
    privacyMode: false,
    yoloMode: false,
    tabAutocomplete: true,
    contextWindow: "auto",
    waitForMcpAuth: true,
    browserAutomation: "off",
    showLocalhostLinks: true,
  },

  rules: [
    {
      id: "r1", name: "orchestration.mdc",
      apply: "Always applied", tokens: 847, enabled: true,
      content: "# Regole operative\n\n## 1. Chirurgico, non verboso\n\nScrivi solo ciò che serve. Niente scaffolding, niente boilerplate a meno che non sia esplicitamente richiesto.\nSu codice esistente: tocca solo ciò che deve cambiare.\n\n## 2. Todo list obbligatoria\n\nPrima di qualsiasi task con più di uno step, produci una todo list concisa.\n\n## 3. Analizza prima di toccare\n\nPrima di ogni edit o aggiunta, leggi il codice circostante."
    },
    {
      id: "r2", name: "ui-design.mdc",
      apply: "Auto-attached (*.tsx, *.css)", tokens: 312, enabled: true,
      content: "# UI Frontend Design (Dark Aesthetic)\n\n## Non-negotiables\n\n- Dark-first: default to dark theme\n- Typography: editorial + characterful; import from Google Fonts\n- Color system: CSS custom properties; one accent color used sparingly\n- Shape language: restrained radius; thin structural borders\n- Spacing: generous; avoid cramped clusters"
    },
    {
      id: "r3", name: "python-style.mdc",
      apply: "Auto-attached (*.py)", tokens: 156, enabled: false,
      content: "# Python Style Guidelines\n\n- Type hints obbligatori su funzioni pubbliche\n- Follow PEP 8 e PEP 484\n- Docstrings in Google style\n- No bare except clauses\n- Logging invece di print()"
    },
  ],

  skills: [
    { id: "s1", name: "html-css-js-app", desc: "Vanilla HTML/CSS/JS app interfaces, no framework", enabled: true },
    { id: "s2", name: "ui-frontend-design", desc: "Dark-first UI components and layout systems", enabled: true },
    { id: "s3", name: "tdd-workflow", desc: "RED→GREEN→REFACTOR cycle, 80%+ coverage target", enabled: true },
    { id: "s4", name: "project-explore", desc: "Codebase mapping with structured output", enabled: true },
    { id: "s5", name: "search-first", desc: "Search before coding, avoid duplication", enabled: true },
    { id: "s6", name: "error-handling", desc: "Error patterns for TypeScript, Python and APIs", enabled: false },
    { id: "s7", name: "python-scripting", desc: "Automation scripts with logging and best practices", enabled: false },
  ],

  subagents: [
    { id: "a1", name: "planner", type: "built-in", prompt: "Specialista di pianificazione. Analizza il task e produce piani strutturati step-by-step. Solo lettura — non modifica codice.", enabled: true },
    { id: "a2", name: "python-reviewer", type: "built-in", prompt: "Revisore Python specializzato. PEP 8, type hint, sicurezza, pattern Pythonici, performance.", enabled: true },
    { id: "a3", name: "bugbot", type: "built-in", prompt: "Review formale del codice. Analisi approfondita di bug potenziali, code smell e vulnerabilità.", enabled: false },
    { id: "a4", name: "doc-updater", type: "custom", prompt: "Aggiorna README, AGENTS.md e docstring dopo modifiche significative. Allinea la documentazione allo stato reale del codice.", enabled: true },
  ],

  commands: [
    { id: "c1", trigger: "/fix", desc: "Fix the selected code error or bug", enabled: true },
    { id: "c2", trigger: "/test", desc: "Generate unit tests for the selected code", enabled: true },
    { id: "c3", trigger: "/docs", desc: "Generate JSDoc / docstring documentation", enabled: true },
    { id: "c4", trigger: "/explain", desc: "Explain this code in plain language", enabled: true },
    { id: "c5", trigger: "/refactor", desc: "Refactor for clarity and performance", enabled: false },
  ],

  mcpServers: [
    { id: "excel", name: "excel", letter: "E", color: "#217346", toolsCount: 25, enabled: true },
    { id: "word", name: "word", letter: "W", color: "#2b579a", toolsCount: 12, enabled: false },
    { id: "filesystem", name: "filesystem", letter: "F", color: "#8B5A2B", toolsCount: 8, enabled: true },
  ],

  mcpConfigs: {
    excel: `{
  "mcpServers": {
    "excel": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-excel"
      ],
      "env": {
        "EXCEL_ALLOWED_PATHS": "C:\\\\Users\\\\Andrea\\\\Desktop"
      }
    }
  }
}`,
    word: `{
  "mcpServers": {
    "word": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-word"
      ],
      "env": {}
    }
  }
}`,
    filesystem: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\\\Users\\\\Andrea\\\\Desktop"
      ],
      "env": {}
    }
  }
}`,
  },

  conversations: [
    { id: 0, title: "Refactor auth module" },
    { id: 1, title: "Fix TypeScript errors" },
    { id: 2, title: "Add unit tests" },
  ],

  fileTree: [
    { name: "cursor-trainer", type: "folder", open: true, depth: 0, children: [
      { name: ".cursor", type: "folder", open: true, depth: 1, children: [
        { name: "rules", type: "folder", open: false, depth: 2, children: [
          { name: "orchestration.mdc", type: "file", ext: "mdc", depth: 3 },
          { name: "ui-design.mdc", type: "file", ext: "mdc", depth: 3 },
          { name: "python-style.mdc", type: "file", ext: "mdc", depth: 3 },
        ]},
        { name: "mcp.json", type: "file", ext: "json", depth: 2 },
      ]},
      { name: "src", type: "folder", open: true, depth: 1, children: [
        { name: "app.ts", type: "file", ext: "ts", depth: 2 },
        { name: "auth.ts", type: "file", ext: "ts", depth: 2 },
        { name: "utils.ts", type: "file", ext: "ts", depth: 2 },
      ]},
      { name: "tests", type: "folder", open: false, depth: 1, children: [
        { name: "app.test.ts", type: "file", ext: "ts", depth: 2 },
      ]},
      { name: "package.json", type: "file", ext: "json", depth: 1 },
      { name: "tsconfig.json", type: "file", ext: "json", depth: 1 },
    ]},
  ],

  tabs: [
    { id: "app.ts", label: "app.ts", ext: "ts" },
    { id: "auth.ts", label: "auth.ts", ext: "ts" },
    { id: "package.json", label: "package.json", ext: "json" },
  ],

  fileContents: {
    "app.ts": `<span class="cmt">// Entry point — corso alfabetizzazione AI</span>
<span class="kw">import</span> { <span class="var">createAuth</span> } <span class="kw">from</span> <span class="str">'./auth'</span>;

<span class="kw">interface</span> <span class="typ">AppConfig</span> {
  <span class="var">apiUrl</span>: <span class="typ">string</span>;
  <span class="var">debug</span>: <span class="typ">boolean</span>;
}

<span class="kw">export async function</span> <span class="fn">bootstrap</span>(<span class="var">config</span>: <span class="typ">AppConfig</span>) {
  <span class="kw">const</span> <span class="var">auth</span> = <span class="fn">createAuth</span>(<span class="var">config</span>.<span class="var">apiUrl</span>);

  <span class="kw">if</span> (<span class="var">config</span>.<span class="var">debug</span>) {
    <span class="var">console</span>.<span class="fn">log</span>(<span class="str">'[dev] Auth initialized'</span>);
  }

  <span class="kw">return</span> { <span class="var">auth</span> };
}`,
    "auth.ts": `<span class="cmt">// Modulo autenticazione — esempio didattico</span>
<span class="kw">export interface</span> <span class="typ">AuthDeps</span> {
  <span class="var">http</span>: <span class="typ">typeof fetch</span>;
  <span class="var">baseUrl</span>: <span class="typ">string</span>;
}

<span class="kw">export function</span> <span class="fn">createAuth</span>(<span class="var">baseUrl</span>: <span class="typ">string</span>) {
  <span class="kw">return</span> {
    <span class="fn">login</span>: <span class="kw">async</span> (<span class="var">email</span>: <span class="typ">string</span>) => {
      <span class="kw">const</span> <span class="var">res</span> = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">\`\${baseUrl}/login\`</span>, {
        <span class="var">method</span>: <span class="str">'POST'</span>,
        <span class="var">body</span>: <span class="typ">JSON</span>.<span class="fn">stringify</span>({ <span class="var">email</span> }),
      });
      <span class="kw">return</span> <span class="var">res</span>.<span class="fn">json</span>();
    },
  };
}`,
    "package.json": `<span class="op">{</span>
  <span class="str">"name"</span>: <span class="str">"cursor-trainer"</span><span class="op">,</span>
  <span class="str">"version"</span>: <span class="str">"1.0.0"</span><span class="op">,</span>
  <span class="str">"type"</span>: <span class="str">"module"</span><span class="op">,</span>
  <span class="str">"scripts"</span>: <span class="op">{</span>
    <span class="str">"dev"</span>: <span class="str">"vite"</span><span class="op">,</span>
    <span class="str">"build"</span>: <span class="str">"tsc &amp;&amp; vite build"</span><span class="op">,</span>
    <span class="str">"test"</span>: <span class="str">"vitest"</span>
  <span class="op">}</span>
<span class="op">}</span>`,
    "orchestration.mdc": `<span class="cmt">---</span>
<span class="var">description</span>: Regole operative — sempre applicate
<span class="var">alwaysApply</span>: <span class="kw">true</span>
<span class="cmt">---</span>

<span class="fn"># Regole operative</span>

<span class="fn">## 1. Chirurgico, non verboso</span>

Scrivi solo ciò che serve. Tocca solo ciò che deve cambiare.

<span class="fn">## 2. Todo list obbligatoria</span>

Prima di qualsiasi task con più di uno step, produci una todo list.`,
  },

  messages: [
    {
      role: "user",
      text: "Refactora il modulo auth per usare dependency injection.",
    },
    {
      role: "assistant",
      text: "Analizzo la struttura del progetto e propongo un refactor incrementale.",
      timeline: ["Thinking", "Reading auth.ts", "Reading app.ts", "Editing auth.ts", "Done"],
      code: `export function createAuth(deps: AuthDeps) {\n  const { http, baseUrl } = deps;\n  return {\n    login: (email: string) =>\n      http(\`\${baseUrl}/login\`, { method: 'POST' }),\n  };\n}`,
    },
  ],
};

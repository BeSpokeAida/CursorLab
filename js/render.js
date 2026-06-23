import { icons, mentionTypes } from "./icons.js";

/* ── helpers ───────────────────────────────────────────── */

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileIcon(ext) {
  if (ext === "ts") return icons.ts;
  if (ext === "js") return icons.js;
  if (ext === "json") return icons.json;
  if (ext === "mdc") return icons.mdc;
  return icons.files;
}

function flattenTree(nodes, result = []) {
  for (const n of nodes) {
    result.push(n);
    if (n.type === "folder" && n.open && n.children) flattenTree(n.children, result);
  }
  return result;
}

function countLines(html) {
  return html.replace(/<[^>]+>/g, "").split("\n").length;
}

function lineNums(n) {
  return Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join("");
}

function highlightJson(raw) {
  return raw
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"([^"\\]+)"(\s*:)/g, '<span class="str">"$1"</span>$2')
    .replace(/:\s*"([^"]*)"/g, (_, v) => `: <span class="str">"${v}"</span>`)
    .replace(/:\s*(\d+)/g, ': <span class="num">$1</span>')
    .replace(/:\s*(true|false|null)/g, ': <span class="kw">$1</span>')
    .replace(/([{}\[\],])/g, '<span class="op">$1</span>');
}

function toggle(on, action, key = "", value = "") {
  return `<button type="button" class="settings-toggle ${on ? "is-on" : ""}" data-action="${action}" data-key="${key}" data-value="${value}" aria-pressed="${on}"></button>`;
}

/* ── Titlebar (Windows style) ───────────────────────────── */

export function renderTitlebar(state) {
  const menus = ["File", "Edit", "Selection", "View", "Go", "Run", "Terminal", "Help"];
  const model = state.models.find((m) => m.id === state.selectedModel);

  return `
    <div class="titlebar__left">
      <div class="titlebar__app-icon" aria-label="Cursor">${icons.cursor}</div>
      <nav class="titlebar__menus" aria-label="Menu applicazione">
        ${menus.map((m) => `<button type="button" class="titlebar__menu-item">${m}</button>`).join("")}
      </nav>
    </div>
    <div class="titlebar__center">
      <div class="titlebar__search" data-action="open-command-palette" role="button" tabindex="0" aria-label="Ricerca rapida">
        ${icons.search}
        <span class="titlebar__search-text">cursor-trainer</span>
        <kbd>Ctrl+P</kbd>
      </div>
    </div>
    <div class="titlebar__right">
      <div class="layout-picker" role="group" aria-label="Modalità layout">
        <button type="button" class="layout-picker__btn ${state.layout === "agent" ? "is-active" : ""}" data-action="set-layout" data-value="agent">Agent</button>
        <button type="button" class="layout-picker__btn ${state.layout === "editor" ? "is-active" : ""}" data-action="set-layout" data-value="editor">Editor</button>
      </div>
      <button type="button" class="icon-btn" data-action="toggle-chat" title="Toggle Chat (Ctrl+Alt+B)">${icons.collapse}</button>
      <button type="button" class="icon-btn titlebar__settings-btn" data-action="open-settings" title="Cursor Settings">${icons.gear}</button>
      <div class="win-controls">
        <button type="button" class="win-ctrl win-ctrl--min" title="Minimizza">&#x2015;</button>
        <button type="button" class="win-ctrl win-ctrl--max" title="Massimizza">&#x25A1;</button>
        <button type="button" class="win-ctrl win-ctrl--close" title="Chiudi">&#x2715;</button>
      </div>
    </div>`;
}

/* ── Activity bar ───────────────────────────────────────── */

export function renderActivitybar(state) {
  const views = [
    { id: "explorer", icon: icons.files, label: "Explorer" },
    { id: "search", icon: icons.search, label: "Cerca" },
    { id: "git", icon: icons.git, label: "Source Control" },
    { id: "debug", icon: icons.debug, label: "Esegui e debug" },
    { id: "extensions", icon: icons.extensions, label: "Estensioni" },
  ];

  const top = views.map((v) => `
    <button type="button" class="activitybar__item ${state.activeView === v.id ? "is-active" : ""}" data-action="set-view" data-value="${v.id}" title="${v.label}" aria-label="${v.label}">
      ${v.icon}
    </button>`).join("");

  return `${top}
    <div class="activitybar__spacer"></div>
    <button type="button" class="activitybar__item is-accent" data-action="open-chat" title="Cursor AI" aria-label="Cursor AI">${icons.cursor}</button>
    <button type="button" class="activitybar__item" data-action="open-settings" title="Impostazioni" aria-label="Account">${icons.account}</button>`;
}

/* ── Sidebar ────────────────────────────────────────────── */

export function renderSidebar(state) {
  const viewLabels = {
    explorer: "Explorer",
    search: "Search",
    git: "Source Control",
    debug: "Run and Debug",
    extensions: "Extensions",
  };

  let content = "";
  if (state.activeView === "explorer") {
    const tree = JSON.parse(JSON.stringify(state.fileTree));
    const markActive = (nodes) => {
      for (const n of nodes) {
        n._active = state.activeTab;
        if (n.children) markActive(n.children);
      }
    };
    markActive(tree);

    const flat = flattenTree(tree);
    content = flat.map((node) => {
      const indent = node.depth * 12;
      const isActive = node.type === "file" && node.name === state.activeTab;
      const chevron = node.type === "folder"
        ? `<span class="file-tree__chevron">${node.open ? icons.chevronDown : icons.chevronRight}</span>`
        : `<span class="file-tree__chevron-placeholder"></span>`;
      const icon = node.type === "folder" ? icons.files : fileIcon(node.ext);
      return `<div class="file-tree__item ${isActive ? "is-active" : ""}" style="padding-left:${8 + indent}px"
          data-action="${node.type === "folder" ? "toggle-folder" : "open-file"}"
          data-name="${esc(node.name)}" data-type="${node.type}">
          ${chevron}${icon}<span>${esc(node.name)}</span>
        </div>`;
    }).join("");
  } else if (state.activeView === "git") {
    content = `<div class="sidebar__section-label">CHANGES</div>
      <div class="file-tree__item"><span class="file-tree__chevron-placeholder"></span>${icons.ts}<span style="color:#4fc1ff">M</span>&nbsp;src/auth.ts</div>
      <div class="file-tree__item"><span class="file-tree__chevron-placeholder"></span>${icons.ts}<span style="color:#4fc1ff">M</span>&nbsp;src/app.ts</div>`;
  } else if (state.activeView === "search") {
    content = `<div style="padding:10px 12px">
      <input class="sidebar__search-input" placeholder="Cerca nei file…" aria-label="Cerca" />
      <div style="margin-top:8px;font-size:11px;color:var(--wb-fg-muted)">Ctrl+Shift+F per aprire</div></div>`;
  } else {
    content = `<div style="padding:16px;font-size:12px;color:var(--wb-fg-muted)">${viewLabels[state.activeView]}</div>`;
  }

  return `
    <div class="sidebar__header">
      <span>${viewLabels[state.activeView] || "Sidebar"}</span>
      <div class="sidebar__actions">
        <button type="button" class="icon-btn" title="Nuovo file">${icons.newFile}</button>
        <button type="button" class="icon-btn" title="Nuova cartella">${icons.newFolder}</button>
        <button type="button" class="icon-btn" title="Aggiorna">${icons.refresh}</button>
      </div>
    </div>
    <div class="sidebar__content">${content}</div>`;
}

/* ── Editor tabs (shared helper) ───────────────────────── */

function renderEditorTabs(state) {
  return state.tabs.map((t) => {
    const isSettings = t.id === "settings";
    const isMcp = t.id.startsWith("mcp-");
    const icon = isSettings ? icons.gear : isMcp ? icons.json : fileIcon(t.ext);
    return `<div class="editor-tab ${t.id === state.activeTab ? "is-active" : ""}" data-action="switch-tab" data-value="${t.id}">
      <span class="editor-tab__icon">${icon}</span>
      <span>${esc(t.label)}</span>
      <button type="button" class="editor-tab__close" data-action="close-tab" data-value="${t.id}" aria-label="Chiudi">${icons.close}</button>
    </div>`;
  }).join("");
}

/* ── Editor ─────────────────────────────────────────────── */

export function renderEditor(state) {
  const tabsRow = `<div class="editor-tabs">${renderEditorTabs(state)}</div>`;

  if (state.activeTab === "settings") {
    return tabsRow + `<div class="settings-page">${renderSettingsPage(state)}</div>`;
  }

  if (state.activeTab.startsWith("mcp-")) {
    const mcpId = state.activeTab.replace("mcp-", "").replace(".json", "");
    const raw = state.mcpConfigs[mcpId] || "{}";
    const highlighted = highlightJson(raw);
    const n = raw.split("\n").length;
    return `${tabsRow}
      <div class="editor-breadcrumb"><span>.cursor</span><span>mcp.json</span></div>
      <div class="editor-body">
        <div class="line-numbers" aria-hidden="true">${lineNums(n)}</div>
        <div class="code-editor">${highlighted}</div>
      </div>`;
  }

  if (state.activeTab.endsWith(".mdc") || state.activeTab === "orchestration.mdc" || state.activeTab === "ui-design.mdc" || state.activeTab === "python-style.mdc") {
    const rule = state.rules.find((r) => r.name === state.activeTab);
    const raw = rule?.content || "# Rule\n\n...";
    const lines = raw.split("\n");
    const highlighted = lines.map((l) => {
      if (l.startsWith("## ")) return `<span class="fn">${esc(l)}</span>`;
      if (l.startsWith("# ")) return `<span class="fn" style="font-size:1.1em">${esc(l)}</span>`;
      if (l.startsWith("- ")) return `<span class="op">-</span> ${esc(l.slice(2))}`;
      if (l.startsWith("---")) return `<span class="cmt">${esc(l)}</span>`;
      return esc(l);
    }).join("\n");
    const n = lines.length;
    return `${tabsRow}
      <div class="editor-breadcrumb"><span>.cursor</span><span>rules</span><span>${esc(state.activeTab)}</span></div>
      <div class="editor-body">
        <div class="line-numbers" aria-hidden="true">${lineNums(n)}</div>
        <div class="code-editor">${highlighted}</div>
      </div>`;
  }

  const content = state.fileContents[state.activeTab] || `<span class="cmt">// File vuoto</span>`;
  const n = countLines(content);
  const breadcrumb = state.activeFile.split("/");

  return `${tabsRow}
    <div class="editor-breadcrumb">${breadcrumb.map((b) => `<span>${esc(b)}</span>`).join("")}</div>
    <div class="editor-body">
      <div class="line-numbers" aria-hidden="true">${lineNums(n)}</div>
      <div class="code-editor">${content}</div>
    </div>`;
}

/* ── Settings page (full tab) ───────────────────────────── */

const SETTINGS_NAV = [
  { id: "general", label: "General", icon: "gear" },
  { id: "vscode-settings", label: "VS Code Settings", icon: "tab", external: true },
  null,
  { id: "plan-usage", label: "Plan & Usage", icon: "creditCard" },
  { id: "agents", label: "Agents", icon: "robot" },
  { id: "tab", label: "Tab", icon: "tab" },
  { id: "models", label: "Models", icon: "lightning" },
  { id: "cloud-agents", label: "Cloud Agents", icon: "cloud" },
  null,
  { id: "plugins", label: "Plugins", icon: "puzzle" },
  { id: "rules-skills-subagents", label: "Rules, Skills, Subagents", icon: "cmd" },
  { id: "tools-mcps", label: "Tools & MCPs", icon: "gear" },
  { id: "hooks", label: "Hooks", icon: "hook" },
  { id: "indexing-docs", label: "Indexing & Docs", icon: "book" },
  { id: "network", label: "Network", icon: "globe" },
  { id: "beta", label: "Beta", icon: "lightning" },
  null,
  { id: "docs", label: "Docs", icon: "book", external: true },
];

function navIcon(id) {
  const map = {
    gear: icons.settings, tab: icons.tab, creditCard: icons.creditCard,
    robot: icons.robot, lightning: icons.lightning, cloud: icons.cloud,
    puzzle: icons.puzzle, cmd: icons.cmd, hook: icons.hook,
    book: icons.book, globe: icons.globe,
  };
  return map[id] || icons.settings;
}

function renderSettingsPage(state) {
  const navHtml = SETTINGS_NAV.map((s) => {
    if (!s) return `<div class="settings-nav-divider"></div>`;
    return `<button type="button" class="settings-nav-item ${state.settingsSection === s.id ? "is-active" : ""} ${s.external ? "settings-nav-item--external" : ""}"
      data-action="set-settings-section" data-value="${s.id}">
      <span class="settings-nav-item__icon">${navIcon(s.icon)}</span>
      <span>${s.label}</span>
    </button>`;
  }).join("");

  const sectionTitle = SETTINGS_NAV.find((s) => s && s.id === state.settingsSection)?.label || "";

  let content = "";
  if (state.settingsSection === "rules-skills-subagents") {
    content = renderRulesSkillsSubagents(state);
  } else if (state.settingsSection === "tools-mcps") {
    content = renderToolsMcps(state);
  } else if (state.settingsSection === "models") {
    content = renderModelsSection(state);
  } else {
    content = `<p style="color:var(--wb-fg-muted);font-size:13px">Questa sezione è disponibile nel prodotto reale in <strong>Cursor Settings → ${esc(sectionTitle)}</strong>.</p>`;
  }

  return `
    <div class="settings-page__sidebar">
      <div class="settings-account">
        <div class="settings-account__avatar">R</div>
        <div class="settings-account__info">
          <div class="settings-account__email">rivelligpt1@studiorivelli.it</div>
          <div class="settings-account__plan">Pro Plan</div>
        </div>
      </div>
      <div class="settings-search-box">
        ${icons.search}
        <input type="text" placeholder="Search settings  Ctrl+F" aria-label="Cerca impostazioni" />
      </div>
      <nav class="settings-nav-list" aria-label="Sezioni impostazioni">${navHtml}</nav>
    </div>
    <div class="settings-page__content">
      <div class="settings-page__header">
        <h1 class="settings-page__title">${esc(sectionTitle)}</h1>
        <button type="button" class="settings-manage-btn">Manage View</button>
      </div>
      ${content}
    </div>`;
}

/* ── Rules, Skills, Subagents ───────────────────────────── */

function renderRulesSkillsSubagents(state) {
  /* Rules */
  const rulesCards = state.rules.map((r) => `
    <div class="settings-card">
      <span class="settings-card__icon">${icons.mdc}</span>
      <div class="settings-card__info">
        <span class="settings-card__name">${esc(r.name)}</span>
        <span class="settings-card__meta">${esc(r.apply)} · ${r.tokens} token</span>
      </div>
      <div class="settings-card__actions">
        <button type="button" class="icon-btn" data-action="edit-rule" data-value="${r.id}" title="Modifica regola">${icons.pencil}</button>
        <button type="button" class="icon-btn" data-action="delete-rule" data-value="${r.id}" title="Elimina">${icons.trash}</button>
        ${toggle(r.enabled, "toggle-rule", "", r.id)}
      </div>
    </div>`).join("");

  /* Skills */
  const skillItems = state.skills.map((s) => `
    <div class="settings-card">
      <span class="settings-card__icon" style="color:var(--cursor-orange)">${icons.lightning}</span>
      <div class="settings-card__info">
        <span class="settings-card__name">${esc(s.name)}</span>
        <span class="settings-card__meta">${esc(s.desc)}</span>
      </div>
      <div class="settings-card__actions">
        ${toggle(s.enabled, "toggle-skill", "", s.id)}
      </div>
    </div>`).join("");

  /* Subagents */
  const subagentItems = state.subagents.map((a) => `
    <div class="settings-card">
      <span class="settings-card__icon" style="color:#58a6ff">${icons.robot}</span>
      <div class="settings-card__info">
        <span class="settings-card__name">${esc(a.name)}
          <span class="settings-card__badge ${a.type === "built-in" ? "settings-card__badge--builtin" : ""}">${a.type === "built-in" ? "built-in" : "custom"}</span>
        </span>
        <span class="settings-card__meta">${esc(a.prompt.slice(0, 80))}…</span>
      </div>
      <div class="settings-card__actions">
        <button type="button" class="icon-btn" data-action="edit-subagent" data-value="${a.id}" title="Modifica prompt">${icons.pencil}</button>
        <button type="button" class="icon-btn" data-action="delete-subagent" data-value="${a.id}" title="Elimina">${icons.trash}</button>
        ${toggle(a.enabled, "toggle-subagent", "", a.id)}
      </div>
    </div>`).join("");

  /* Commands */
  const commandItems = state.commands.map((c) => `
    <div class="settings-card settings-card--command">
      <span class="settings-card__trigger">${esc(c.trigger)}</span>
      <span class="settings-card__info">
        <span class="settings-card__meta">${esc(c.desc)}</span>
      </span>
      <div class="settings-card__actions">
        <button type="button" class="icon-btn" title="Modifica">${icons.pencil}</button>
        <button type="button" class="icon-btn" title="Elimina">${icons.trash}</button>
        ${toggle(c.enabled, "toggle-command", "", c.id)}
      </div>
    </div>`).join("");

  return `
    <div class="settings-subsection">
      <div class="settings-subsection-header">
        <div>
          <div class="settings-subsection-title">Rules</div>
          <p class="settings-subsection-desc">Istruzioni persistenti per l'AI. Salvate in <code class="inline-code">.cursor/rules/</code> come file <code class="inline-code">.mdc</code>.</p>
        </div>
        <button type="button" class="settings-add-btn" data-action="add-rule">${icons.plus} Add Rule</button>
      </div>
      ${rulesCards}
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-header">
        <div>
          <div class="settings-subsection-title">Skills</div>
          <p class="settings-subsection-desc">Capacità specializzate caricate su richiesta da <code class="inline-code">~/.cursor/skills/</code></p>
        </div>
      </div>
      ${skillItems}
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-header">
        <div>
          <div class="settings-subsection-title">Subagents</div>
          <p class="settings-subsection-desc">Agent specializzati delegati dal thread principale tramite <code class="inline-code">Task tool</code></p>
        </div>
        <button type="button" class="settings-add-btn" data-action="add-subagent">${icons.plus} Add Subagent</button>
      </div>
      ${subagentItems}
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-header">
        <div>
          <div class="settings-subsection-title">Commands</div>
          <p class="settings-subsection-desc">Comandi slash nel composer (<code class="inline-code">/fix</code>, <code class="inline-code">/test</code>…)</p>
        </div>
        <button type="button" class="settings-add-btn" data-action="add-command">${icons.plus} Add Command</button>
      </div>
      ${commandItems}
    </div>`;
}

/* ── Tools & MCPs ───────────────────────────────────────── */

function renderToolsMcps(state) {
  const { settings, mcpServers } = state;

  const mcpCards = mcpServers.map((mcp) => {
    const statusText = mcp.enabled ? `${mcp.toolsCount} tools enabled` : "Disabled";
    const dotCls = mcp.enabled ? "mcp-dot" : "mcp-dot mcp-dot--off";
    return `
      <div class="mcp-card">
        <div class="mcp-avatar" style="background:${mcp.color}">${esc(mcp.letter)}</div>
        <div class="mcp-card__info">
          <span class="mcp-card__name">${esc(mcp.name)}</span>
          <span class="mcp-card__status">
            <span class="${dotCls}"></span>
            ${esc(statusText)}
            ${mcp.enabled ? `<span class="mcp-tools-arrow">${icons.chevronDown}</span>` : ""}
          </span>
        </div>
        <div class="mcp-card__actions">
          <button type="button" class="icon-btn" data-action="refresh-mcp" data-value="${mcp.id}" title="Ricarica">${icons.refresh}</button>
          <button type="button" class="icon-btn" data-action="edit-mcp" data-value="${mcp.id}" title="Modifica configurazione">${icons.pencil}</button>
          <button type="button" class="icon-btn" data-action="delete-mcp" data-value="${mcp.id}" title="Rimuovi">${icons.trash}</button>
          ${toggle(mcp.enabled, "toggle-mcp", "", mcp.id)}
        </div>
      </div>`;
  }).join("");

  return `
    <div class="settings-subsection">
      <div class="settings-subsection-title">Authentication</div>
      <div class="settings-row-inline">
        <div class="settings-row-inline__label">
          <strong>Wait for MCP Authentication</strong>
          <span class="settings-row-inline__desc">Wait indefinitely to authenticate when prompted. When off, skip authentication prompts after 30 seconds.</span>
        </div>
        ${toggle(settings.waitForMcpAuth, "toggle-setting", "waitForMcpAuth")}
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-title">Browser</div>
      <div class="settings-row-inline">
        <div class="settings-row-inline__label">
          <strong>Browser Automation</strong>
          <span class="settings-row-inline__desc">Browser automation disabled</span>
        </div>
        <select class="settings-select-inline" data-action="set-setting" data-key="browserAutomation">
          <option value="off" ${settings.browserAutomation === "off" ? "selected" : ""}>Off</option>
          <option value="playwright" ${settings.browserAutomation === "playwright" ? "selected" : ""}>Playwright</option>
          <option value="puppeteer" ${settings.browserAutomation === "puppeteer" ? "selected" : ""}>Puppeteer</option>
        </select>
      </div>
      <div class="settings-row-inline" style="margin-top:12px">
        <div class="settings-row-inline__label">
          <strong>Show Localhost Links in Browser</strong>
          <span class="settings-row-inline__desc">Automatically open localhost links in the Browser Tab</span>
        </div>
        ${toggle(settings.showLocalhostLinks, "toggle-setting", "showLocalhostLinks")}
      </div>
    </div>

    <div class="settings-subsection">
      <div class="settings-subsection-header">
        <div class="settings-subsection-title">Installed MCP Servers</div>
      </div>
      ${mcpCards}
      <button type="button" class="mcp-new-btn" data-action="add-mcp">
        ${icons.plus}
        <span>New MCP Server</span>
        <span style="font-size:11px;color:var(--wb-fg-subtle);margin-left:auto">Add a Custom MCP Server</span>
      </button>
    </div>`;
}

/* ── Models section ─────────────────────────────────────── */

function renderModelsSection(state) {
  const modelOptions = state.models.map((m) =>
    `<option value="${m.id}" ${state.settings.selectedModelDefault === m.id ? "selected" : ""}>${esc(m.label)} — ${m.provider}</option>`
  ).join("");

  return `
    <div class="settings-subsection">
      <div class="settings-row-inline">
        <div class="settings-row-inline__label">
          <strong>Modello predefinito Chat</strong>
          <span class="settings-row-inline__desc">Usato per Ctrl+L e pannello Agent</span>
        </div>
        <select class="settings-select-inline" data-action="set-setting" data-key="selectedModelDefault">${modelOptions}</select>
      </div>
      <div class="settings-row-inline" style="margin-top:12px">
        <div class="settings-row-inline__label">
          <strong>Temperature</strong>
          <span class="settings-row-inline__desc">0 = deterministico · 1 = creativo. Controlla la variabilità delle risposte.</span>
        </div>
        <div class="settings-slider-wrap">
          <input type="range" class="settings-slider" data-action="set-setting" data-key="temperature" min="0" max="1" step="0.1" value="${state.settings.temperature}" />
          <span class="settings-slider-val">${state.settings.temperature}</span>
        </div>
      </div>
      <div class="settings-row-inline" style="margin-top:12px">
        <div class="settings-row-inline__label">
          <strong>Streaming risposte</strong>
          <span class="settings-row-inline__desc">Mostra il testo man mano che viene generato</span>
        </div>
        ${toggle(state.settings.streaming, "toggle-setting", "streaming")}
      </div>
    </div>`;
}

/* ── Chat panel ─────────────────────────────────────────── */

export function renderChat(state) {
  const model = state.models.find((m) => m.id === state.selectedModel);

  const convList = state.layout === "agent" ? `
    <div class="agent-conversations">
      <div class="agent-conversations__search">${icons.search} Cerca conversazioni…</div>
      <div class="agent-conversations__list">
        ${state.conversations.map((c) => `
          <div class="agent-conv-item ${c.id === state.activeConversation ? "is-active" : ""}"
            data-action="select-conversation" data-value="${c.id}">${esc(c.title)}</div>`).join("")}
      </div>
    </div>` : "";

  const messages = state.messages.map((msg) => {
    const roleLabel = msg.role === "user" ? "Tu" : "Agent";
    const roleCls = msg.role === "user" ? "chat-message__role--user" : "";
    let body = `<div class="chat-message__body">${esc(msg.text)}</div>`;
    if (msg.timeline) {
      const pillMap = { Thinking: "thinking", "Reading auth.ts": "reading", "Reading app.ts": "reading", "Editing auth.ts": "editing", Grepping: "grepping", Done: "done" };
      const pills = msg.timeline.map((p) => `<span class="agent-pill agent-pill--${pillMap[p] || "thinking"}">${esc(p)}</span>`).join("");
      body = `<div class="agent-timeline">${pills}</div>` + body;
    }
    if (msg.code) body += `<pre><code>${esc(msg.code)}</code></pre>`;
    return `<article class="chat-message"><div class="chat-message__role ${roleCls}">${roleLabel}</div>${body}</article>`;
  }).join("");

  const modes = ["agent", "ask", "manual"];
  const modeTabs = modes.map((m) => `
    <button type="button" class="composer__mode-tab ${state.composerMode === m ? "is-active" : ""}" data-action="set-composer-mode" data-value="${m}" role="tab">
      ${m.charAt(0).toUpperCase() + m.slice(1)}
    </button>`).join("");

  const mentions = state.mentionsOpen ? `
    <div class="mentions-popup" role="listbox">
      ${mentionTypes.map((m, i) => `
        <div class="mentions-popup__item ${i === state.mentionHighlight ? "is-highlighted" : ""}" data-action="insert-mention" data-value="${m.id}" role="option">
          ${m.icon}<span><strong>${esc(m.label)}</strong> — ${esc(m.desc)}</span>
        </div>`).join("")}
    </div>` : "";

  return `${convList}
    <div class="chat-panel__header">
      <span class="chat-panel__title">${state.layout === "agent" ? "Agent" : "Chat"}</span>
      <div class="chat-panel__header-actions">
        <button type="button" class="icon-btn" title="Cronologia">${icons.clock}</button>
        <button type="button" class="icon-btn" data-action="new-chat" title="Nuova chat">${icons.newFile}</button>
        <button type="button" class="icon-btn" data-action="open-settings" title="Impostazioni">${icons.settings}</button>
      </div>
    </div>
    <div class="chat-history">${messages}</div>
    <div class="composer">
      <div class="composer__toolbar">
        <button type="button" class="composer__select" data-action="cycle-model" title="Cambia modello">
          <span>${esc(model?.label || "model")}</span>${icons.chevronDown}
        </button>
        <div class="composer__mode-tabs" role="tablist">${modeTabs}</div>
      </div>
      <div class="composer__input-wrap">
        ${mentions}
        <textarea class="composer__textarea" data-action="composer-input" placeholder="Plan, @ for context, / for commands" aria-label="Messaggio">${esc(state.composerText)}</textarea>
        <div class="composer__input-actions">
          <div class="composer__attach-group">
            <button type="button" class="icon-btn" data-action="toggle-mentions" title="Contesto @">${icons.at}</button>
            <button type="button" class="icon-btn" title="Allega immagine">${icons.image}</button>
          </div>
          <button type="button" class="composer__send" data-action="send-message" aria-label="Invia">${icons.send}</button>
        </div>
      </div>
    </div>`;
}

/* ── Status bar ─────────────────────────────────────────── */

export function renderStatusbar(state) {
  const model = state.models.find((m) => m.id === state.selectedModel);
  return `
    <div class="statusbar__left">
      <span class="statusbar__item">${icons.branch} main</span>
      <span class="statusbar__item">${icons.error} 0&nbsp;&nbsp;⚠ 0</span>
    </div>
    <div class="statusbar__spacer"></div>
    <div class="statusbar__right">
      <span class="statusbar__item" data-action="open-settings" style="cursor:pointer">${esc(model?.label || "")}</span>
      <span class="statusbar__item">Agent</span>
      <span class="statusbar__item">Ln 12, Col 4</span>
      <span class="statusbar__item">UTF-8</span>
      <span class="statusbar__item">TypeScript</span>
      <span class="statusbar__item">${icons.bell}</span>
    </div>`;
}

/* ── renderAll ──────────────────────────────────────────── */

export function renderAll(state, regions) {
  regions.titlebar.innerHTML = renderTitlebar(state);
  regions.activitybar.innerHTML = renderActivitybar(state);
  regions.sidebar.innerHTML = renderSidebar(state);
  regions.editor.innerHTML = renderEditor(state);
  regions.chat.innerHTML = renderChat(state);
  regions.statusbar.innerHTML = renderStatusbar(state);

  regions.workbench.dataset.layout = state.layout;
  regions.workbench.classList.toggle("is-chat-hidden", !state.chatVisible);
  regions.workbench.classList.toggle("is-sidebar-hidden", !state.sidebarVisible);
}

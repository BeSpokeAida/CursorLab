import { initialState } from "./state.js";
import { renderAll } from "./render.js";
import { mentionTypes } from "./icons.js";
import {
  addRuleToTree,
  addSkillToTree,
  addSubagentToTree,
  addCommandToTree,
  buildRuleContent,
  buildSkillContent,
  buildSubagentContent,
  buildCommandContent,
  countTokens,
  normalizeRuleName,
  normalizeSkillName,
  normalizeCommandTrigger,
  commandFileName,
  pathToTabId,
  pathToActiveFile,
} from "./filetree.js";

const state = structuredClone(initialState);

function $(selector, root = document) {
  const el = root.querySelector(selector);
  if (!el) throw new Error(`Elemento non trovato: ${selector}`);
  return el;
}

const regions = {
  titlebar: $("[data-region='titlebar']"),
  workbench: $("[data-region='workbench']"),
  activitybar: $("[data-region='activitybar']"),
  sidebar: $("[data-region='sidebar']"),
  editor: $("[data-region='editor']"),
  chat: $("[data-region='chat']"),
  statusbar: $("[data-region='statusbar']"),
  createOverlay: $("[data-region='create-overlay']"),
};

function render(options = {}) {
  const ta = regions.chat.querySelector("[data-action='composer-input']");
  const caret = options.preserveComposerCaret && ta ? ta.selectionStart : null;

  renderAll(state, regions);

  if (caret !== null) {
    const next = regions.chat.querySelector("[data-action='composer-input']");
    if (next) {
      next.focus();
      next.setSelectionRange(caret, caret);
    }
  }
}

function ensureTab(id, label, ext) {
  if (!state.tabs.find((t) => t.id === id)) {
    state.tabs.push({ id, label: label || id, ext });
  }
}

function openFileByPath(path, ext) {
  const tabId = pathToTabId(path.startsWith("cursor-trainer") ? path : `.cursor/${path}`);
  const activeFile = pathToActiveFile(path.startsWith(".cursor") || path.startsWith("cursor-trainer") ? path : `.cursor/${path}`);
  ensureTab(tabId, tabId, ext);
  state.activeTab = tabId;
  state.activeFile = activeFile.startsWith(".cursor") ? activeFile : `.cursor/${activeFile}`;
}

function findById(arr, id) {
  return arr.find((x) => x.id === id);
}

function findFolder(nodes, name) {
  for (const n of nodes) {
    if (n.name === name && n.type === "folder") return n;
    if (n.children) {
      const found = findFolder(n.children, name);
      if (found) return found;
    }
  }
  return null;
}

function dispatch(action, payload = {}) {
  let preserveComposerCaret = false;

  switch (action) {

    /* ── Layout ── */
    case "set-layout":
      state.layout = payload.value;
      break;

    case "toggle-chat":
      state.chatVisible = !state.chatVisible;
      break;

    case "open-chat":
      state.chatVisible = true;
      break;

    /* ── Settings tab ── */
    case "open-settings":
      ensureTab("settings", "Cursor Settings", "settings");
      state.activeTab = "settings";
      break;

    case "set-settings-section":
      state.settingsSection = payload.value;
      break;

    /* ── Toggle/set settings values ── */
    case "toggle-setting": {
      const k = payload.key || payload.value;
      state.settings[k] = !state.settings[k];
      break;
    }

    case "set-setting": {
      const k = payload.key;
      let v = payload.value;
      if (payload.type === "range" || payload.type === "number") v = Number(v);
      state.settings[k] = v;
      if (k === "selectedModelDefault") state.selectedModel = v;
      break;
    }

    /* ── Sidebar views ── */
    case "set-view":
      state.activeView = payload.value;
      state.sidebarVisible = true;
      break;

    case "toggle-folder": {
      const folder = findFolder(state.fileTree, payload.name);
      if (folder) folder.open = !folder.open;
      break;
    }

    /* ── Tabs / files ── */
    case "open-file": {
      const path = payload.path || payload.name;
      const fname = payload.name;
      const ext = fname.split(".").pop();

      if (path && (path.includes(".cursor/") || path.includes("/skills/") || path.includes("/subagents/") || path.includes("/commands/") || fname.endsWith(".mdc") || fname.endsWith(".md"))) {
        const tabId = pathToTabId(path);
        const activeFile = pathToActiveFile(path);
        ensureTab(tabId, tabId, ext);
        state.activeTab = tabId;
        state.activeFile = activeFile;
        break;
      }

      state.activeTab = fname;
      const isRoot = ["package.json", "tsconfig.json", "mcp.json"].includes(fname);
      const isTest = fname.includes(".test.");
      state.activeFile = isRoot ? fname : isTest ? `tests/${fname}` : `src/${fname}`;
      if (!state.tabs.find((t) => t.id === fname)) {
        state.tabs.push({ id: fname, label: fname, ext });
      }
      break;
    }

    case "switch-tab":
      state.activeTab = payload.value;
      if (payload.value === "settings") break;
      if (payload.value.startsWith("mcp-")) break;
      if (payload.value.includes("/") || payload.value.endsWith(".mdc") || payload.value.endsWith(".md")) {
        state.activeFile = `.cursor/${payload.value}`;
      } else {
        const isRoot = ["package.json", "tsconfig.json"].includes(payload.value);
        state.activeFile = isRoot ? payload.value : `src/${payload.value}`;
      }
      break;

    case "close-tab": {
      const closing = payload.value;
      state.tabs = state.tabs.filter((t) => t.id !== closing);
      if (state.activeTab === closing) {
        state.activeTab = state.tabs.length ? state.tabs[state.tabs.length - 1].id : "app.ts";
        ensureTab("app.ts", "app.ts", "ts");
        state.activeTab = state.tabs[0]?.id || "app.ts";
      }
      break;
    }

    /* ── Composer ── */
    case "set-composer-mode":
      state.composerMode = payload.value;
      preserveComposerCaret = true;
      break;

    case "cycle-model":
    case "toggle-model-picker":
      state.modelPickerOpen = !state.modelPickerOpen;
      if (state.modelPickerOpen) state.mentionsOpen = false;
      preserveComposerCaret = true;
      break;

    case "select-model":
      state.selectedModel = payload.value;
      state.settings.selectedModelDefault = payload.value;
      state.modelPickerOpen = false;
      preserveComposerCaret = true;
      break;

    case "close-model-picker":
      state.modelPickerOpen = false;
      preserveComposerCaret = true;
      break;

    case "toggle-mentions":
      state.mentionsOpen = !state.mentionsOpen;
      state.mentionHighlight = 0;
      preserveComposerCaret = true;
      break;

    case "insert-mention": {
      const m = mentionTypes.find((x) => x.id === payload.value);
      if (m) {
        const insert = m.label + " ";
        state.composerText = state.composerText ? `${state.composerText} ${insert}` : insert;
      }
      state.mentionsOpen = false;
      render({ preserveComposerCaret: true });
      return;
    }

    case "composer-input":
      return;

    case "new-chat":
      state.messages = [];
      state.composerText = "";
      break;

    case "select-conversation":
      state.activeConversation = Number(payload.value);
      break;

    case "send-message": {
      const text = state.composerText.trim();
      if (!text) return;
      state.messages.push({ role: "user", text });
      state.composerText = "";
      state.mentionsOpen = false;
      const model = state.models.find((m) => m.id === state.selectedModel);
      const modeReplies = {
        agent: `Modalità **Agent** — eseguirei: indicizzazione contesto, planning, modifica multi-file, comandi terminal.\nModello: \`${model?.label}\` · temperature: ${state.settings.temperature} · max tokens: ${state.settings.maxTokens}`,
        ask: `Modalità **Ask** — solo risposte, nessuna modifica automatica al codice.\nPer applicare cambiamenti usa Agent o Ctrl+K inline.`,
        manual: `Modalità **Manual** — mostro il piano e attendo approvazione prima di ogni step.\nUtile per contesti regolati (AI Act, audit trail).`,
      };
      state.messages.push({
        role: "assistant",
        text: modeReplies[state.composerMode] || modeReplies.ask,
        timeline: state.composerMode === "agent" ? ["Thinking", "Grepping", "Done"] : undefined,
      });
      break;
    }

    /* ── Rules ── */
    case "toggle-rule": {
      const r = findById(state.rules, payload.value);
      if (r) r.enabled = !r.enabled;
      break;
    }

    case "edit-rule": {
      const r = findById(state.rules, payload.value);
      if (!r) break;
      ensureTab(r.name, r.name, "mdc");
      state.activeTab = r.name;
      state.activeFile = `.cursor/rules/${r.name}`;
      break;
    }

    case "delete-rule": {
      const rule = findById(state.rules, payload.value);
      if (rule) {
        state.rules = state.rules.filter((r) => r.id !== payload.value);
        delete state.fileContents[rule.name];
        state.tabs = state.tabs.filter((t) => t.id !== rule.name);
      }
      break;
    }

    case "open-create-modal":
      state.createModal = {
        open: true,
        type: payload.value,
        draft: { name: "", desc: "", content: "" },
      };
      break;

    case "close-create-modal":
      state.createModal = { open: false, type: null, draft: { name: "", desc: "", content: "" } };
      break;

    case "create-draft-input":
      state.createModal.draft[payload.key] = payload.value;
      return;

    case "submit-create": {
      const { type, draft } = state.createModal;
      const name = (draft.name || "").trim();
      const desc = (draft.desc || "").trim();
      const content = (draft.content || "").trim();
      if (!name) return;

      if (type === "rule") {
        const fileName = normalizeRuleName(name);
        if (!fileName) return;
        const body = buildRuleContent(desc, content);
        const id = `r${Date.now()}`;
        state.rules.push({
          id,
          name: fileName,
          apply: desc || "Custom rule",
          tokens: countTokens(body),
          enabled: true,
          content: body,
        });
        addRuleToTree(state.fileTree, fileName);
        state.fileContents[fileName] = body;
        openFileByPath(`rules/${fileName}`, "mdc");
      }

      if (type === "skill") {
        const skillName = normalizeSkillName(name);
        if (!skillName) return;
        const body = buildSkillContent(skillName, desc, content);
        const id = `s${Date.now()}`;
        state.skills.push({
          id,
          name: skillName,
          desc: desc || "Custom skill",
          enabled: true,
          content: body,
        });
        addSkillToTree(state.fileTree, skillName);
        const fileKey = `skills/${skillName}/SKILL.md`;
        state.fileContents[fileKey] = body;
        openFileByPath(fileKey, "md");
      }

      if (type === "subagent") {
        const agentName = normalizeSkillName(name);
        if (!agentName) return;
        const body = buildSubagentContent(agentName, desc, content);
        const id = `a${Date.now()}`;
        state.subagents.push({
          id,
          name: agentName,
          type: "custom",
          prompt: content || desc,
          desc: desc || "",
          enabled: true,
          content: body,
        });
        addSubagentToTree(state.fileTree, agentName);
        const fileKey = `subagents/${agentName}.md`;
        state.fileContents[fileKey] = body;
        openFileByPath(fileKey, "md");
      }

      if (type === "command") {
        const trigger = normalizeCommandTrigger(name);
        if (!trigger || trigger === "/") return;
        const fileName = commandFileName(trigger);
        const body = buildCommandContent(trigger, desc, content);
        const id = `c${Date.now()}`;
        state.commands.push({
          id,
          trigger,
          desc: desc || "Custom command",
          enabled: true,
          content: body,
        });
        addCommandToTree(state.fileTree, fileName);
        const fileKey = `commands/${fileName}`;
        state.fileContents[fileKey] = body;
        openFileByPath(fileKey, "md");
      }

      state.createModal = { open: false, type: null, draft: { name: "", desc: "", content: "" } };
      ensureTab("settings", "Cursor Settings", "settings");
      state.activeTab = "settings";
      state.settingsSection = "rules-skills-subagents";
      break;
    }

    case "edit-skill": {
      const s = findById(state.skills, payload.value);
      if (!s) break;
      const fileKey = `skills/${s.name}/SKILL.md`;
      openFileByPath(fileKey, "md");
      break;
    }

    case "edit-command": {
      const c = findById(state.commands, payload.value);
      if (!c) break;
      openFileByPath(`commands/${c.trigger.slice(1)}.md`, "md");
      break;
    }

    case "delete-command":
      state.commands = state.commands.filter((c) => c.id !== payload.value);
      break;

    /* ── Skills ── */
    case "toggle-skill": {
      const s = findById(state.skills, payload.value);
      if (s) s.enabled = !s.enabled;
      break;
    }

    /* ── Subagents ── */
    case "toggle-subagent": {
      const a = findById(state.subagents, payload.value);
      if (a) a.enabled = !a.enabled;
      break;
    }

    case "edit-subagent": {
      const a = findById(state.subagents, payload.value);
      if (!a) break;
      openFileByPath(`subagents/${a.name}.md`, "md");
      break;
    }

    case "delete-subagent":
      state.subagents = state.subagents.filter((a) => a.id !== payload.value);
      break;

    /* ── Commands ── */
    case "toggle-command": {
      const c = findById(state.commands, payload.value);
      if (c) c.enabled = !c.enabled;
      break;
    }

    /* ── MCP ── */
    case "toggle-mcp": {
      const mcp = findById(state.mcpServers, payload.value);
      if (mcp) mcp.enabled = !mcp.enabled;
      break;
    }

    case "edit-mcp": {
      const mcpId = payload.value;
      const tabId = `mcp-${mcpId}.json`;
      ensureTab(tabId, `${mcpId} — mcp.json`, "json");
      state.activeTab = tabId;
      // switch back to editor if we're in settings
      break;
    }

    case "refresh-mcp": {
      const mcp = findById(state.mcpServers, payload.value);
      if (mcp) {
        state.messages.push({ role: "assistant", text: `MCP **${mcp.name}** ricaricato. ${mcp.toolsCount} tools disponibili.` });
        state.chatVisible = true;
      }
      break;
    }

    case "delete-mcp":
      state.mcpServers = state.mcpServers.filter((m) => m.id !== payload.value);
      break;

    case "add-mcp":
      state.messages.push({ role: "assistant", text: 'Per aggiungere un MCP Server:\n```json\n{\n  "mcpServers": {\n    "nome-server": {\n      "command": "npx",\n      "args": ["-y", "@org/server-name"],\n      "env": {}\n    }\n  }\n}\n```\nSalva in `.cursor/mcp.json` (progetto) o `~/.cursor/mcp.json` (globale).' });
      state.chatVisible = true;
      break;

    case "open-command-palette":
      state.messages.push({ role: "assistant", text: "Command Palette (Ctrl+P): accesso rapido a file, comandi, impostazioni.\nCtrl+Shift+P per i comandi — prova a digitare \"Cursor Settings\" per aprire le impostazioni." });
      state.chatVisible = true;
      break;

    default:
      return;
  }

  render({ preserveComposerCaret });
}

/* ── Event delegation ───────────────────────────────────── */

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-action='submit-create']") && e.target.type === "submit") {
    e.preventDefault();
    dispatch("submit-create");
    return;
  }

  const el = e.target.closest("[data-action]");
  if (!el) {
    let closed = false;
    if (state.mentionsOpen && !e.target.closest(".composer__input-wrap")) {
      state.mentionsOpen = false;
      closed = true;
    }
    if (state.modelPickerOpen && !e.target.closest(".composer__model-wrap")) {
      state.modelPickerOpen = false;
      closed = true;
    }
    if (closed) render({ preserveComposerCaret: true });
    return;
  }

  const action = el.dataset.action;
  const value = el.dataset.value;
  const name = el.dataset.name;
  const path = el.dataset.path;
  const key = el.dataset.key;

  if (action === "composer-input" || action === "create-draft-input") return;

  if (action === "close-tab") {
    e.stopPropagation();
    dispatch("close-tab", { value });
    return;
  }

  if (action === "close-create-modal" && e.target === regions.createOverlay) {
    dispatch("close-create-modal");
    return;
  }

  e.preventDefault();

  const handlers = {
    "set-layout": () => dispatch("set-layout", { value }),
    "toggle-chat": () => dispatch("toggle-chat"),
    "open-chat": () => dispatch("open-chat"),
    "open-settings": () => dispatch("open-settings"),
    "set-settings-section": () => dispatch("set-settings-section", { value }),
    "toggle-setting": () => dispatch("toggle-setting", { key: key || value }),
    "set-view": () => dispatch("set-view", { value }),
    "toggle-folder": () => dispatch("toggle-folder", { name }),
    "open-file": () => dispatch("open-file", { name, path }),
    "switch-tab": () => dispatch("switch-tab", { value }),
    "set-composer-mode": () => dispatch("set-composer-mode", { value }),
    "toggle-model-picker": () => dispatch("toggle-model-picker"),
    "select-model": () => dispatch("select-model", { value }),
    "close-model-picker": () => dispatch("close-model-picker"),
    "toggle-mentions": () => dispatch("toggle-mentions"),
    "insert-mention": () => dispatch("insert-mention", { value }),
    "select-conversation": () => dispatch("select-conversation", { value }),
    "new-chat": () => dispatch("new-chat"),
    "send-message": () => dispatch("send-message"),
    "open-command-palette": () => dispatch("open-command-palette"),
    "toggle-rule": () => dispatch("toggle-rule", { value }),
    "edit-rule": () => dispatch("edit-rule", { value }),
    "delete-rule": () => dispatch("delete-rule", { value }),
    "open-create-modal": () => dispatch("open-create-modal", { value }),
    "close-create-modal": () => dispatch("close-create-modal"),
    "submit-create": () => dispatch("submit-create"),
    "toggle-skill": () => dispatch("toggle-skill", { value }),
    "edit-skill": () => dispatch("edit-skill", { value }),
    "toggle-subagent": () => dispatch("toggle-subagent", { value }),
    "edit-subagent": () => dispatch("edit-subagent", { value }),
    "delete-subagent": () => dispatch("delete-subagent", { value }),
    "toggle-command": () => dispatch("toggle-command", { value }),
    "edit-command": () => dispatch("edit-command", { value }),
    "delete-command": () => dispatch("delete-command", { value }),
    "toggle-mcp": () => dispatch("toggle-mcp", { value }),
    "edit-mcp": () => dispatch("edit-mcp", { value }),
    "refresh-mcp": () => dispatch("refresh-mcp", { value }),
    "delete-mcp": () => dispatch("delete-mcp", { value }),
    "add-mcp": () => dispatch("add-mcp"),
  };

  handlers[action]?.();
});

regions.createOverlay?.addEventListener("click", (e) => {
  if (e.target === regions.createOverlay) dispatch("close-create-modal");
});

document.addEventListener("input", (e) => {
  const composer = e.target.closest("[data-action='composer-input']");
  if (composer) {
    state.composerText = composer.value;
    if (composer.value.endsWith("@") && !state.mentionsOpen) {
      state.mentionsOpen = true;
      state.mentionHighlight = 0;
      render({ preserveComposerCaret: true });
    }
    return;
  }

  const draft = e.target.closest("[data-action='create-draft-input']");
  if (draft) dispatch("create-draft-input", { key: draft.dataset.key, value: draft.value });

  const setting = e.target.closest("[data-action='set-setting']");
  if (setting) dispatch("set-setting", { key: setting.dataset.key, value: setting.value, type: setting.type });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.createModal?.open) {
    dispatch("close-create-modal");
    return;
  }

  if (e.key === "Escape" && state.modelPickerOpen) {
    state.modelPickerOpen = false;
    render({ preserveComposerCaret: true });
    return;
  }

  if (e.key === "Escape" && state.mentionsOpen) {
    state.mentionsOpen = false;
    render({ preserveComposerCaret: true });
    return;
  }

  if (state.mentionsOpen) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.mentionHighlight = (state.mentionHighlight + 1) % mentionTypes.length;
      render({ preserveComposerCaret: true });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.mentionHighlight = (state.mentionHighlight - 1 + mentionTypes.length) % mentionTypes.length;
      render({ preserveComposerCaret: true });
    } else if (e.key === "Enter") {
      e.preventDefault();
      dispatch("insert-mention", { value: mentionTypes[state.mentionHighlight].id });
    }
    return;
  }

  const ta = document.activeElement;
  if (ta?.matches("[data-action='composer-input']") && e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    dispatch("send-message");
  }
});

document.addEventListener("DOMContentLoaded", () => render());

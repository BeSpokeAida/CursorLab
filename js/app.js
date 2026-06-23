import { initialState } from "./state.js";
import { renderAll } from "./render.js";
import { mentionTypes } from "./icons.js";

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
};

function render() {
  renderAll(state, regions);
}

function ensureTab(id, label, ext) {
  if (!state.tabs.find((t) => t.id === id)) {
    state.tabs.push({ id, label, ext });
  }
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
      const fname = payload.name;
      state.activeTab = fname;
      const isRoot = ["package.json", "tsconfig.json"].includes(fname);
      const isTest = fname.includes(".test.");
      const isMdc = fname.endsWith(".mdc");
      state.activeFile = isRoot ? fname : isTest ? `tests/${fname}` : isMdc ? `.cursor/rules/${fname}` : `src/${fname}`;
      if (!state.tabs.find((t) => t.id === fname)) {
        const ext = fname.split(".").pop();
        state.tabs.push({ id: fname, label: fname, ext });
      }
      break;
    }

    case "switch-tab":
      state.activeTab = payload.value;
      if (payload.value === "settings") {
        // no file path needed
      } else if (payload.value.startsWith("mcp-")) {
        // already handled in render
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
      break;

    case "cycle-model": {
      const idx = state.models.findIndex((m) => m.id === state.selectedModel);
      state.selectedModel = state.models[(idx + 1) % state.models.length].id;
      state.settings.selectedModelDefault = state.selectedModel;
      break;
    }

    case "toggle-mentions":
      state.mentionsOpen = !state.mentionsOpen;
      state.mentionHighlight = 0;
      break;

    case "insert-mention": {
      const m = mentionTypes.find((x) => x.id === payload.value);
      if (m) {
        const insert = m.label + " ";
        state.composerText = state.composerText ? `${state.composerText} ${insert}` : insert;
      }
      state.mentionsOpen = false;
      break;
    }

    case "composer-input":
      state.composerText = payload.value;
      if (payload.value.endsWith("@") && !state.mentionsOpen) {
        state.mentionsOpen = true;
        state.mentionHighlight = 0;
      }
      break;

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

    case "delete-rule":
      state.rules = state.rules.filter((r) => r.id !== payload.value);
      break;

    case "add-rule":
      state.messages.push({ role: "assistant", text: 'Per aggiungere una Rule: crea un file `.mdc` in `.cursor/rules/`. Usa la struttura:\n```\n---\ndescription: Descrizione breve\nalwaysApply: false\n---\n# Titolo\n\nContenuto della regola...\n```' });
      state.chatVisible = true;
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

    case "delete-subagent":
      state.subagents = state.subagents.filter((a) => a.id !== payload.value);
      break;

    case "edit-subagent": {
      const a = findById(state.subagents, payload.value);
      if (a) {
        state.messages.push({ role: "assistant", text: `Prompt subagent **${a.name}**:\n\n"${a.prompt}"` });
        state.chatVisible = true;
      }
      break;
    }

    case "add-subagent":
      state.messages.push({ role: "assistant", text: 'I subagent vengono configurati come Task nel workflow di orchestrazione. Aggiungi un\'entry nella tabella Subagents del tuo AGENTS.md o crea un Custom Agent tramite il Task tool.' });
      state.chatVisible = true;
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

  render();
}

/* ── Event delegation ───────────────────────────────────── */

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) {
    if (state.mentionsOpen && !e.target.closest(".composer__input-wrap")) {
      state.mentionsOpen = false;
      render();
    }
    return;
  }

  const action = el.dataset.action;
  const value = el.dataset.value;
  const name = el.dataset.name;
  const key = el.dataset.key;

  if (action === "composer-input") return;

  if (action === "close-tab") {
    e.stopPropagation();
    dispatch("close-tab", { value });
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
    "open-file": () => dispatch("open-file", { name }),
    "switch-tab": () => dispatch("switch-tab", { value }),
    "set-composer-mode": () => dispatch("set-composer-mode", { value }),
    "cycle-model": () => dispatch("cycle-model"),
    "toggle-mentions": () => dispatch("toggle-mentions"),
    "insert-mention": () => dispatch("insert-mention", { value }),
    "select-conversation": () => dispatch("select-conversation", { value }),
    "new-chat": () => dispatch("new-chat"),
    "send-message": () => dispatch("send-message"),
    "open-command-palette": () => dispatch("open-command-palette"),
    "toggle-rule": () => dispatch("toggle-rule", { value }),
    "edit-rule": () => dispatch("edit-rule", { value }),
    "delete-rule": () => dispatch("delete-rule", { value }),
    "add-rule": () => dispatch("add-rule"),
    "toggle-skill": () => dispatch("toggle-skill", { value }),
    "toggle-subagent": () => dispatch("toggle-subagent", { value }),
    "edit-subagent": () => dispatch("edit-subagent", { value }),
    "delete-subagent": () => dispatch("delete-subagent", { value }),
    "add-subagent": () => dispatch("add-subagent"),
    "toggle-command": () => dispatch("toggle-command", { value }),
    "add-command": () => dispatch("add-command"),
    "toggle-mcp": () => dispatch("toggle-mcp", { value }),
    "edit-mcp": () => dispatch("edit-mcp", { value }),
    "refresh-mcp": () => dispatch("refresh-mcp", { value }),
    "delete-mcp": () => dispatch("delete-mcp", { value }),
    "add-mcp": () => dispatch("add-mcp"),
  };

  handlers[action]?.();
});

document.addEventListener("input", (e) => {
  const el = e.target.closest("[data-action='composer-input']");
  if (el) dispatch("composer-input", { value: el.value });

  const setting = e.target.closest("[data-action='set-setting']");
  if (setting) dispatch("set-setting", { key: setting.dataset.key, value: setting.value, type: setting.type });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.mentionsOpen) {
    state.mentionsOpen = false;
    render();
    return;
  }

  if (state.mentionsOpen) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.mentionHighlight = (state.mentionHighlight + 1) % mentionTypes.length;
      render();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.mentionHighlight = (state.mentionHighlight - 1 + mentionTypes.length) % mentionTypes.length;
      render();
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

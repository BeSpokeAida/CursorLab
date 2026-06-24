/** Helpers per manipolare il file tree e sincronizzare i contenuti */

export function getProjectRoot(tree) {
  return tree[0] ?? null;
}

export function findCursorFolder(tree) {
  const root = getProjectRoot(tree);
  return root?.children?.find((n) => n.name === ".cursor") ?? null;
}

export function ensureSubfolder(parent, name, depth) {
  if (!parent.children) parent.children = [];
  let folder = parent.children.find((n) => n.name === name && n.type === "folder");
  if (!folder) {
    folder = { name, type: "folder", open: true, depth, children: [] };
    parent.children.push(folder);
    parent.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }
  return folder;
}

export function addFileNode(folder, fileName, ext, depth) {
  if (!folder.children) folder.children = [];
  if (folder.children.some((n) => n.name === fileName && n.type === "file")) return false;
  folder.children.push({ name: fileName, type: "file", ext, depth });
  folder.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  folder.open = true;
  return true;
}

export function flattenTreeWithPath(nodes, parentPath = "", result = []) {
  for (const node of nodes) {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    result.push({ ...node, path });
    if (node.type === "folder" && node.open && node.children) {
      flattenTreeWithPath(node.children, path, result);
    }
  }
  return result;
}

export function countTokens(text) {
  return Math.max(1, Math.ceil(String(text || "").length / 4));
}

export function normalizeRuleName(name) {
  const base = name.trim().replace(/\.mdc$/i, "");
  return base ? `${base}.mdc` : "";
}

export function normalizeSkillName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

export function normalizeCommandTrigger(name) {
  const t = name.trim();
  if (!t) return "";
  return t.startsWith("/") ? t : `/${t}`;
}

export function commandFileName(trigger) {
  return `${normalizeCommandTrigger(trigger).slice(1) || "command"}.md`;
}

/** Aggiunge una rule al tree: .cursor/rules/{name}.mdc */
export function addRuleToTree(tree, fileName) {
  const cursor = findCursorFolder(tree);
  if (!cursor) return;
  cursor.open = true;
  const rules = ensureSubfolder(cursor, "rules", 2);
  addFileNode(rules, fileName, "mdc", 3);
}

/** Aggiunge skill: .cursor/skills/{name}/SKILL.md */
export function addSkillToTree(tree, skillName) {
  const cursor = findCursorFolder(tree);
  if (!cursor) return;
  cursor.open = true;
  const skills = ensureSubfolder(cursor, "skills", 2);
  if (!skills.children) skills.children = [];
  let skillFolder = skills.children.find((n) => n.name === skillName && n.type === "folder");
  if (!skillFolder) {
    skillFolder = {
      name: skillName,
      type: "folder",
      open: true,
      depth: 3,
      children: [{ name: "SKILL.md", type: "file", ext: "md", depth: 4 }],
    };
    skills.children.push(skillFolder);
    skills.children.sort((a, b) => a.name.localeCompare(b.name));
  }
  skills.open = true;
}

/** Aggiunge subagent: .cursor/subagents/{name}.md */
export function addSubagentToTree(tree, name) {
  const cursor = findCursorFolder(tree);
  if (!cursor) return;
  cursor.open = true;
  const folder = ensureSubfolder(cursor, "subagents", 2);
  addFileNode(folder, `${name}.md`, "md", 3);
}

/** Aggiunge command: .cursor/commands/{name}.md */
export function addCommandToTree(tree, fileName) {
  const cursor = findCursorFolder(tree);
  if (!cursor) return;
  cursor.open = true;
  const folder = ensureSubfolder(cursor, "commands", 2);
  addFileNode(folder, fileName, "md", 3);
}

export function removeFileFromTree(tree, filePath) {
  const parts = filePath.split("/");
  const fileName = parts.pop();
  let nodes = getProjectRoot(tree)?.children;
  if (!nodes) return;

  for (let i = 0; i < parts.length; i++) {
    const folder = nodes?.find((n) => n.name === parts[i] && n.type === "folder");
    if (!folder) return;
    if (i === parts.length - 1) {
      folder.children = (folder.children || []).filter((n) => n.name !== fileName);
      return;
    }
    nodes = folder.children;
  }
}

export function buildRuleContent(desc, body) {
  return `---\ndescription: ${desc || "Custom rule"}\nalwaysApply: false\n---\n\n${body || "# Nuova regola\n\n"}`;
}

export function buildSkillContent(name, desc, body) {
  return `---\nname: ${name}\ndescription: ${desc || ""}\n---\n\n${body || `# ${name}\n\n`}`;
}

export function buildSubagentContent(name, desc, prompt) {
  return `---\nname: ${name}\ntype: custom\ndescription: ${desc || ""}\n---\n\n${prompt || ""}`;
}

export function buildCommandContent(trigger, desc, body) {
  return `---\ntrigger: ${normalizeCommandTrigger(trigger)}\ndescription: ${desc || ""}\n---\n\n${body || ""}`;
}

export function pathToTabId(path) {
  const rel = String(path).replace(/^cursor-trainer\//, "").replace(/^\.cursor\//, "");
  if (rel.startsWith("rules/") && rel.endsWith(".mdc")) return rel.split("/").pop();
  if (rel === "mcp.json") return "mcp.json";
  return rel;
}

export function pathToActiveFile(path) {
  const rel = String(path).replace(/^cursor-trainer\//, "");
  if (rel.startsWith(".cursor/")) return rel;
  if (rel.startsWith("src/") || rel.startsWith("tests/")) return rel;
  return rel;
}

export const CREATE_MODAL_CONFIG = {
  rule: {
    title: "Nuova Rule",
    icon: "mdc",
    submit: "Crea Rule",
    fields: [
      { key: "name", label: "Nome file", placeholder: "mia-regola.mdc", hint: "Salvata in .cursor/rules/" },
      { key: "desc", label: "Descrizione", placeholder: "Always applied · Auto-attached (*.py)" },
      { key: "content", label: "Contenuto", type: "textarea", placeholder: "# Titolo regola\n\nIstruzioni per l'AI…", rows: 8 },
    ],
  },
  skill: {
    title: "Nuova Skill",
    icon: "lightning",
    submit: "Crea Skill",
    fields: [
      { key: "name", label: "Nome skill", placeholder: "my-skill-name", hint: "Cartella in .cursor/skills/" },
      { key: "desc", label: "Descrizione", placeholder: "Quando attivare questa skill" },
      { key: "content", label: "Contenuto SKILL.md", type: "textarea", placeholder: "# Skill\n\n## When to use\n…", rows: 8 },
    ],
  },
  subagent: {
    title: "Nuovo Subagent",
    icon: "robot",
    submit: "Crea Subagent",
    fields: [
      { key: "name", label: "Nome subagent", placeholder: "my-reviewer", hint: "File in .cursor/subagents/" },
      { key: "desc", label: "Descrizione breve", placeholder: "Ruolo e contesto d'uso" },
      { key: "content", label: "System prompt", type: "textarea", placeholder: "Sei un revisore specializzato in…", rows: 8 },
    ],
  },
  command: {
    title: "Nuovo Command",
    icon: "cmd",
    submit: "Crea Command",
    fields: [
      { key: "name", label: "Trigger", placeholder: "/mycommand", hint: "Comando slash nel composer" },
      { key: "desc", label: "Descrizione", placeholder: "Cosa fa questo comando" },
      { key: "content", label: "Prompt template", type: "textarea", placeholder: "Analizza il codice selezionato e…", rows: 6 },
    ],
  },
};

# 🎓 CursorLab — Simulatore didattico dell'IDE Cursor

> Un ambiente immersivo per imparare a usare Cursor senza collegarsi a servizi reali.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-interno-blue)
![Built With](https://img.shields.io/badge/built%20with-HTML%20%7C%20CSS%20%7C%20Vanilla%20JS-orange)
![AI Act](https://img.shields.io/badge/AI%20Act-compliant-green)

---

## 🧠 Cos'è CursorLab?

**CursorLab** è un simulatore didattico che riproduce l'interfaccia di **Cursor**, l'IDE con assistente AI integrato.

A differenza di slide statiche o demo registrate, gli studenti possono **esplorare liberamente** l'ambiente: aprire file, navigare nelle impostazioni, configurare regole e skill, simulare una chat con l'agente — tutto in locale, senza API key né connessione a modelli reali.

Progettato da **BespokeAIDA** per corsi di alfabetizzazione all'AI e formazione conforme all'**AI Act**.

---

## 🎬 Contesto d'uso

Immagina una sessione formativa su *pair programming con AI*.

Il docente non vuole che ogni partecipante installi Cursor, spenda crediti o rischi di inviare dati sensibili a un modello esterno.

Apre **CursorLab** nel browser: ogni studente vede un IDE credibile, con file tree, editor, pannello chat e impostazioni — e può sperimentare senza conseguenze operative.

---

## ✨ Funzionalità

### 🖥 Interfaccia IDE completa
- Barra del titolo, activity bar, sidebar esplora file
- Editor con tab multipli e syntax highlighting simulato
- Pannello chat AI laterale (Agent / Editor)
- Status bar e layout workbench fedele all'originale

### 💬 Chat AI simulata
- Composer con selezione modello (dropdown)
- Modalità Agent e Editor
- Risposte didattiche predefinite — nessuna chiamata a LLM reali
- Banner educativo sempre visibile

### ⚙️ Impostazioni e configurazione
- **Rules** — regole di progetto con anteprima contenuto
- **Skills** — competenze attivabili/disattivabili
- **Subagents** — agenti specializzati (planner, reviewer, bugbot…)
- **Commands** — slash command configurabili
- **MCP** — server MCP simulati con JSON di configurazione
- Modali di creazione per rules, skills e subagent

### 📁 File tree interattivo
- Struttura progetto di esempio espandibile
- Apertura file nell'editor
- Navigazione realistica tra cartelle e file

### 🛡 Design didattico
- Messaggi chiari per funzioni non implementate
- Nessun dato inviato all'esterno
- Etichettatura esplicita: *simulatore, non prodotto commerciale*

---

## 🧱 Stack tecnico

- HTML5
- CSS3 (design tokens, dark theme)
- JavaScript ES modules (vanilla, senza framework)
- Stato in-memory con render dichiarativo

---

## 🎯 Perché esiste

La maggior parte della formazione sull'AI coding assistant fallisce perché è **passiva**: si guarda, non si tocca.

CursorLab nasce per rendere l'apprendimento:
- **concreto** — si clicca, si naviga, si sbaglia senza rischi
- **accessibile** — basta un browser, zero installazione
- **sicuro** — niente API, niente dati in cloud
- **conforme** — pensato per contesti regolamentati (AI Act)

L'obiettivo non è sostituire Cursor, ma **preparare** chi lo userà per la prima volta in produzione.

---

## 📂 Struttura del progetto

```
cursor-trainer/
├── index.html          # Entry point
├── assets/             # Logo BespokeAIDA
├── styles/
│   ├── tokens.css      # Design tokens
│   └── main.css        # Layout e componenti
└── js/
    ├── app.js          # Eventi e dispatch
    ├── state.js        # Stato iniziale e dati demo
    ├── render.js       # Rendering UI
    ├── filetree.js     # Albero file
    └── icons.js        # Icone SVG inline
```

---

## 🤝 Contributi

Il progetto è mantenuto internamente da **BespokeAIDA**.

Per segnalazioni, miglioramenti all'interfaccia o nuovi scenari didattici, contattare il team formativo.

---

## ⚠️ Disclaimer

Questo progetto è destinato **esclusivamente** a scopi didattici e di alfabetizzazione all'AI.

- Non è affiliato, approvato o sponsorizzato da **Cursor** o **Anysphere**
- Non si connette a servizi, modelli o API reali
- Non deve essere usato come sostituto del prodotto in ambienti di produzione
- L'interfaccia è una **replica non commerciale** a scopo formativo

---

**CursorLab by BespokeAIDA** · Simulatore didattico AI Act

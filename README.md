<div align="center">

# 🎯 cld

### **tig for Claude Code**

*Browse your Claude Code session history like a pro*

[![npm version](https://img.shields.io/npm/v/claudash.svg)](https://www.npmjs.com/package/claudash)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/claudash.svg)](https://nodejs.org)

[Quick Start](#-quick-start) • [Features](#-features) • [Keybindings](#️-keybindings) • [Why?](#-why-cld)

</div>

---

## 🤔 The Problem

Ever thought:
- *"What was I working on with Claude yesterday?"*
- *"I had a great session where we fixed that bug... where is it?"*
- *"How much have I used Claude across my projects?"*

Your Claude Code history is a goldmine of context, but buried in JSON files. **Until now.**

---

## ✨ The Solution

**cld** is an interactive terminal dashboard for Claude Code sessions. Think `tig` for git, but for your AI pair programming history.

### One Command. Instant Clarity.

```bash
cld
```

Browse hundreds of sessions. Jump to any project. Never lose context again.

---

## 🚀 Quick Start

```bash
# Install
npm install -g claudash

# Launch
cld
```

That's it. You're browsing your Claude history.

**Basic usage:**

- `↑` `↓` or `j` `k` - Navigate sessions
- `Enter` or `→` - View session details
- `c` - Copy project path to clipboard
- `q` - Quit

---

## 🎨 Features

### 📊 Interactive Dashboard
- **Like tig, but for Claude Code** - Browse sessions with vim keybindings
- **Smart grouping** - Sessions organized by project
- **Color-coded recency** - Green (today), yellow (this week), gray (older)
- **Lightning fast** - Handles 10,000+ sessions without breaking a sweat

### 🎯 Session Deep-Dive
- **First & Last Messages** - See how sessions started and where they ended
- **Rich Statistics**:
  - Message counts (user/assistant)
  - Tools used (Bash, Edit, Write, etc.)
  - Token consumption
  - Session duration
  - Git branch & working directory

### ⚡ Power User Features
- **Clipboard integration** - Copy paths with `c`
- **Vim navigation** - `j`/`k`, `g`/`G`, all the classics
- **Arrow key navigation** - `←`/`→` to navigate views
- **LRU caching** - Smart memory management for blazing speed

### 🎭 Two Modes

**TUI Mode** (Default)
```bash
cld              # Interactive dashboard
```

**List Mode** (Quick overview)
```bash
cld --list       # Text-based list
cld --list 20    # Show 20 projects
```

---

## 💡 Use Cases

### 1. **Resume Work**
*"What was I doing in that project last week?"*
```bash
cld              # Browse sessions
→                # View session details
# See first/last messages, remember context
```

### 2. **Copy Project Paths**
*"Need the path to that project I worked on"*
```bash
cld              # Launch
↓ ↓ ↓            # Navigate to project
c                # Copy path to clipboard
# Paste wherever you need it
```

### 3. **Session Analysis**
*"How much Claude usage across all projects?"*
```bash
cld --list 50    # See top 50 projects
# Total sessions, message counts, last active times
```

### 4. **Context Recovery**
*"I asked Claude something about OAuth... find that session"*
```bash
cld              # Browse by project
→                # View details
# Read first/last messages to find it
```

---

## 🔥 Why cld?

### The Pattern You Know

| Tool | Purpose | Command |
|------|---------|---------|
| `git log` | View commits | Plain text list |
| **`tig`** | Browse commits | **Interactive TUI** ✨ |
| `cld --list` | View sessions | Plain text list |
| **`cld`** | Browse sessions | **Interactive TUI** ✨ |

### The Naming

- **Package**: `claudash` - Searchable on npm
- **Binary**: `cld` - Fast to type (like `rg`, `fd`, `git`)
- **Mnemonic**: **CL**aude **D**ashboard

Just like `ripgrep` → `rg` and `fd-find` → `fd`, we follow the pattern of memorable packages with short binaries.

---

## 📦 Installation

### Global Install (Recommended)

```bash
npm install -g claudash
```

### Run Without Installing

```bash
npx claudash
```

### Local Development

```bash
git clone https://github.com/claudash/claudash.git
cd claudash
npm install
npm link
cld
```

---


## ⌨️ Keybindings

### Session List

| Key | Action |
|-----|--------|
| `↑` `↓` `j` `k` | Navigate sessions |
| `Enter` / `→` | View session details |
| `c` | Copy project path to clipboard |
| `g` / `G` | Jump to top / bottom |
| `PageUp` / `PageDown` | Scroll faster |
| `?` | Show help |
| `q` | Quit |

### Session Details

| Key | Action |
|-----|--------|
| `↑` `↓` `j` `k` | Scroll content |
| `g` / `G` | Jump to top / bottom |
| `←` `ESC` `q` | Back to list |

---

## 🎯 Example Output

### List Mode
```
🔍 Recent Claude Code Sessions

📂 ~/ideas/claudeboard
   Last active: 2m ago
   Sessions: 2 | Messages: 11
   Latest: "Implement the following plan: # claudash TUI Dashboard..."

📂 ~/ideas/timea
   Last active: 23m ago
   Sessions: 1 | Messages: 59
   Latest: "follow the links here and do a comprehensive summary..."

📂 ~/remote/github.com/rgbjs/docs
   Last active: 56m ago
   Sessions: 1 | Messages: 61
   Latest: "do deep research for rgb 0.12 and create technical docs..."
```

### TUI Mode

Interactive dashboard showing:
- ✅ Sessions grouped by project
- ✅ Color-coded by recency
- ✅ Vim-style navigation
- ✅ Detailed session view with stats

*(GIF demo coming soon)*

---

## 🛠️ Technical Details

### Architecture

- **Fast Indexing** - Parses `~/.claude/history.jsonl` in <500ms for 10,000 sessions
- **Lazy Loading** - Session details loaded on-demand
- **LRU Cache** - Keeps 100 most recent sessions in memory
- **Cross-Platform** - Linux, macOS, Windows clipboard support

### Data Source

Reads from `~/.claude/` directory:
- `history.jsonl` - Fast session index
- `projects/[encoded-path]/[session-id].jsonl` - Full session data

### Dependencies

- **blessed** - Terminal UI framework (only runtime dependency)
- **Node.js** ≥ 14

---

## 🗺️ Roadmap

- [ ] **Search/Filter** - Find sessions by keyword
- [ ] **Sort Options** - By date, messages, tools used
- [ ] **Session Export** - Export to markdown/JSON
- [ ] **Timeline View** - See message history within session
- [ ] **Stats Dashboard** - Aggregate usage analytics
- [ ] **Fuzzy Finder** - fzf-style quick jump
- [ ] **Session Diff** - Compare sessions side-by-side

---

## 🤝 Contributing

Contributions welcome! Here's how:

1. **Fork & Clone**
   ```bash
   git fork https://github.com/claudash/claudash.git
   cd claudash
   npm install
   ```

2. **Make Changes**
   ```bash
   git checkout -b feature/amazing-feature
   # Hack away
   npm link  # Test locally
   ```

3. **Submit PR**
   ```bash
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   # Open PR on GitHub
   ```

### Ideas Welcome

- 💡 Feature requests → [Open an issue](https://github.com/claudash/claudash/issues)
- 🐛 Bug reports → [Open an issue](https://github.com/claudash/claudash/issues)
- 📖 Docs improvements → PRs appreciated!

---

## 📜 License

MIT © [Melvin Carvalho](https://github.com/melvincarvalho)

---

## 🌟 Star History

If you find `cld` useful, consider giving it a star! ⭐

It helps others discover the tool and motivates continued development.

---

## 🙏 Acknowledgments

- Inspired by [tig](https://github.com/jonas/tig) - The text-mode interface for git
- Built with [blessed](https://github.com/chjj/blessed) - Terminal UI library
- Created for the [Claude Code](https://www.anthropic.com/claude) community

---

<div align="center">

**[⬆ back to top](#-cld)**

Made with ❤️ for Claude Code users everywhere

</div>

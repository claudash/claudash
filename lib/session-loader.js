const fs = require('fs');
const path = require('path');
const os = require('os');

const HISTORY_FILE = path.join(os.homedir(), '.claude', 'history.jsonl');
const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

// LRU cache for session details (keep 100 most recent)
const sessionCache = new Map();
const MAX_CACHE_SIZE = 100;

/**
 * Encode project path for directory lookup
 * /home/melvin/foo -> -home-melvin-foo
 */
function encodeProjectPath(projectPath) {
  return projectPath.replace(/\//g, '-');
}

/**
 * Build session index from history.jsonl
 * Returns array of session summaries with quick metadata
 */
function buildSessionIndex() {
  const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
  const lines = content.trim().split('\n');

  const sessions = new Map();

  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      const { timestamp, project, display, sessionId } = entry;

      if (!project || !timestamp || !sessionId) return;

      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          sessionId,
          project,
          timestamp,
          firstMessage: display,
          messageCount: 0,
          lastTimestamp: timestamp
        });
      }

      const session = sessions.get(sessionId);
      session.messageCount++;
      session.lastTimestamp = Math.max(session.lastTimestamp, timestamp);
    } catch (err) {
      // Skip malformed lines
    }
  });

  // Convert to array and sort by most recent
  return Array.from(sessions.values())
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

/**
 * Get full session detail from session file
 * Loads from cache if available, otherwise reads from disk
 */
function getSessionDetail(sessionId, projectPath) {
  // Check cache
  if (sessionCache.has(sessionId)) {
    return sessionCache.get(sessionId);
  }

  // Load from disk
  const encodedPath = encodeProjectPath(projectPath);
  const sessionFile = path.join(PROJECTS_DIR, encodedPath, `${sessionId}.jsonl`);

  if (!fs.existsSync(sessionFile)) {
    return null;
  }

  // Check file size - skip files over 100MB
  const fileStats = fs.statSync(sessionFile);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  if (fileSizeMB > 100) {
    console.error(`Session file too large: ${fileSizeMB.toFixed(0)}MB - skipping`);
    return {
      sessionId,
      projectPath,
      firstUserMessage: { content: `[Session file too large: ${fileSizeMB.toFixed(0)}MB]`, timestamp: Date.now() },
      lastUserMessage: { content: '[File too large to load]', timestamp: Date.now() },
      stats: { totalMessages: 0, userMessages: 0, assistantMessages: 0, toolCalls: 0, totalTokens: 0, duration: 0, tools: [] },
      gitBranch: null,
      cwd: projectPath,
      entries: []
    };
  }

  let content;
  try {
    content = fs.readFileSync(sessionFile, 'utf-8');
  } catch (err) {
    console.error(`Failed to read session file: ${err.message}`);
    return null;
  }

  const lines = content.trim().split('\n');

  const entries = [];
  lines.forEach(line => {
    try {
      entries.push(JSON.parse(line));
    } catch (err) {
      // Skip malformed lines
    }
  });

  // Extract details
  const firstUserMessage = extractFirstUserMessage(entries);
  const lastUserMessage = extractLastUserMessage(entries);
  const stats = calculateStats(entries);
  const gitBranch = extractGitBranch(entries);
  const cwd = extractCwd(entries);

  const detail = {
    sessionId,
    projectPath,
    firstUserMessage,
    lastUserMessage,
    stats,
    gitBranch,
    cwd,
    entries
  };

  // Add to cache
  sessionCache.set(sessionId, detail);

  // Maintain cache size
  if (sessionCache.size > MAX_CACHE_SIZE) {
    const firstKey = sessionCache.keys().next().value;
    sessionCache.delete(firstKey);
  }

  return detail;
}

/**
 * Extract first user message (parentUuid === null && type === "user")
 */
function extractFirstUserMessage(entries) {
  for (const entry of entries) {
    if (entry.type === 'user' && entry.parentUuid === null) {
      return {
        content: entry.message?.content || '',
        timestamp: entry.timestamp,
        uuid: entry.uuid
      };
    }
  }
  return null;
}

/**
 * Extract last user message (most recent type === "user")
 * Skips messages with array content (tool results)
 */
function extractLastUserMessage(entries) {
  let lastUserEntry = null;

  for (const entry of entries) {
    if (entry.type === 'user') {
      const content = entry.message?.content;
      // Skip messages with array content (tool results)
      if (typeof content === 'string') {
        if (!lastUserEntry || entry.timestamp > lastUserEntry.timestamp) {
          lastUserEntry = entry;
        }
      }
    }
  }

  if (lastUserEntry) {
    return {
      content: lastUserEntry.message?.content || '',
      timestamp: lastUserEntry.timestamp,
      uuid: lastUserEntry.uuid
    };
  }

  return null;
}

/**
 * Calculate session statistics
 */
function calculateStats(entries) {
  const stats = {
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
    toolCalls: 0,
    totalTokens: 0,
    duration: 0,
    tools: new Set()
  };

  let firstTimestamp = null;
  let lastTimestamp = null;

  entries.forEach(entry => {
    if (entry.type === 'user') {
      stats.userMessages++;
      stats.totalMessages++;
    } else if (entry.type === 'assistant') {
      stats.assistantMessages++;
      stats.totalMessages++;

      // Count tokens
      if (entry.message?.usage) {
        const usage = entry.message.usage;
        stats.totalTokens += (usage.input_tokens || 0) + (usage.output_tokens || 0);
      }

      // Count tool calls
      if (entry.message?.content) {
        const toolCalls = entry.message.content.filter(c => c.type === 'tool_use');
        stats.toolCalls += toolCalls.length;

        // Track tool names
        toolCalls.forEach(tool => {
          if (tool.name) stats.tools.add(tool.name);
        });
      }
    }

    // Track duration
    if (entry.timestamp) {
      const ts = new Date(entry.timestamp).getTime();
      if (!firstTimestamp || ts < firstTimestamp) firstTimestamp = ts;
      if (!lastTimestamp || ts > lastTimestamp) lastTimestamp = ts;
    }
  });

  if (firstTimestamp && lastTimestamp) {
    stats.duration = lastTimestamp - firstTimestamp;
  }

  stats.tools = Array.from(stats.tools);

  return stats;
}

/**
 * Extract git branch from first entry
 */
function extractGitBranch(entries) {
  for (const entry of entries) {
    if (entry.gitBranch) {
      return entry.gitBranch;
    }
  }
  return null;
}

/**
 * Extract working directory from first entry
 */
function extractCwd(entries) {
  for (const entry of entries) {
    if (entry.cwd) {
      return entry.cwd;
    }
  }
  return null;
}

module.exports = {
  buildSessionIndex,
  getSessionDetail,
  encodeProjectPath
};

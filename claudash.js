#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const HISTORY_FILE = path.join(os.homedir(), '.claude', 'history.jsonl');

function parseHistory() {
  const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
  const lines = content.trim().split('\n');

  const sessions = new Map();

  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      const { timestamp, project, display, sessionId } = entry;

      if (!project || !timestamp || !sessionId) return;

      const key = sessionId;

      if (!sessions.has(key)) {
        sessions.set(key, {
          project,
          timestamp,
          sessionId,
          messages: [],
          firstMessage: display,
          messageCount: 0,
          lastTimestamp: timestamp
        });
      }

      const session = sessions.get(key);
      session.messages.push(display);
      session.messageCount++;
      session.lastTimestamp = Math.max(session.lastTimestamp, timestamp);
    } catch (err) {
      // Skip malformed lines
    }
  });

  return Array.from(sessions.values());
}

function groupByProject(sessions) {
  const grouped = new Map();

  sessions.forEach(session => {
    if (!grouped.has(session.project)) {
      grouped.set(session.project, []);
    }
    grouped.get(session.project).push(session);
  });

  return grouped;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function formatPath(fullPath) {
  const home = os.homedir();
  return fullPath.replace(home, '~');
}

function main() {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : 10;

  console.log('🔍 Recent Claude Code Sessions\n');

  const sessions = parseHistory();
  const grouped = groupByProject(sessions);

  // Sort projects by most recent session
  const sortedProjects = Array.from(grouped.entries())
    .map(([project, projectSessions]) => ({
      project,
      sessions: projectSessions.sort((a, b) => b.lastTimestamp - a.lastTimestamp),
      lastActive: Math.max(...projectSessions.map(s => s.lastTimestamp))
    }))
    .sort((a, b) => b.lastActive - a.lastActive)
    .slice(0, limit);

  sortedProjects.forEach(({ project, sessions }) => {
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const mostRecent = sessions[0];

    console.log(`📂 ${formatPath(project)}`);
    console.log(`   Last active: ${formatTime(mostRecent.lastTimestamp)}`);
    console.log(`   Sessions: ${sessions.length} | Messages: ${totalMessages}`);
    console.log(`   Latest: "${mostRecent.firstMessage.substring(0, 60)}${mostRecent.firstMessage.length > 60 ? '...' : ''}"`);
    console.log('');
  });

  console.log(`\nShowing ${sortedProjects.length} most recent projects (${sessions.length} total sessions)`);
  console.log(`Usage: claudash [limit]`);
}

main();

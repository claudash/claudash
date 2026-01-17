const os = require('os');

/**
 * Format timestamp as relative time
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return date.toLocaleDateString();
}

/**
 * Format duration in milliseconds
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${hours}h ${minutes % 60}m`;
}

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num) {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Format file path with ~ for home directory
 */
function formatPath(fullPath) {
  const home = os.homedir();
  return fullPath.replace(home, '~');
}

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get color based on recency
 */
function getRecencyColor(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = diff / 3600000;

  if (hours < 24) return 'green';
  if (hours < 168) return 'yellow'; // 7 days
  return 'gray';
}

/**
 * Wrap text to max width
 */
function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxWidth) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

/**
 * Extract first line of text
 */
function firstLine(text) {
  if (!text) return '';
  return text.split('\n')[0];
}

/**
 * Format session list item
 */
function formatSessionListItem(session) {
  const path = formatPath(session.project);
  const firstMsg = truncate(firstLine(session.firstMessage), 50);
  const time = formatTime(session.lastTimestamp);
  const msgCount = session.messageCount;

  return `${path} • ${msgCount} msgs • ${firstMsg} • ${time}`;
}

module.exports = {
  formatTime,
  formatDuration,
  formatNumber,
  formatPath,
  truncate,
  getRecencyColor,
  wrapText,
  firstLine,
  formatSessionListItem
};

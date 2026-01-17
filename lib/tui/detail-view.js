const blessed = require('blessed');
const { formatTime, formatDuration, formatNumber, formatPath, wrapText } = require('./utils');

/**
 * Create session detail view
 */
function createDetailView(screen, detail, onBack) {
  if (!detail) {
    // Show error if session couldn't be loaded
    const errorBox = blessed.box({
      top: 'center',
      left: 'center',
      width: '50%',
      height: 5,
      content: ' Error: Could not load session details',
      border: {
        type: 'line'
      },
      style: {
        fg: 'red',
        border: {
          fg: 'red'
        }
      }
    });

    screen.append(errorBox);
    errorBox.focus();

    errorBox.key(['escape', 'q', 'enter', 'left'], () => {
      screen.remove(errorBox);
      onBack();
      screen.render();
    });

    screen.render();
    return errorBox;
  }

  // Build content
  let lines = [];

  try {

  // Header
  lines.push('{bold}{cyan-fg}Session Details{/cyan-fg}{/bold}');
  lines.push('');

  // Metadata
  lines.push(`{bold}Project:{/bold} ${formatPath(detail.projectPath)}`);
  lines.push(`{bold}Session ID:{/bold} ${detail.sessionId}`);
  if (detail.gitBranch) {
    lines.push(`{bold}Git Branch:{/bold} ${detail.gitBranch}`);
  }
  if (detail.cwd) {
    lines.push(`{bold}Working Directory:{/bold} ${formatPath(detail.cwd)}`);
  }
  lines.push('');

  // Stats
  lines.push('{bold}{yellow-fg}Statistics{/yellow-fg}{/bold}');
  lines.push(`  Messages: ${detail.stats.userMessages} user, ${detail.stats.assistantMessages} assistant (${detail.stats.totalMessages} total)`);
  lines.push(`  Tool Calls: ${detail.stats.toolCalls}`);
  if (detail.stats.tools.length > 0) {
    lines.push(`  Tools Used: ${detail.stats.tools.join(', ')}`);
  }
  if (detail.stats.totalTokens > 0) {
    lines.push(`  Tokens: ${formatNumber(detail.stats.totalTokens)}`);
  }
  if (detail.stats.duration > 0) {
    lines.push(`  Duration: ${formatDuration(detail.stats.duration)}`);
  }
  lines.push('');

  // First user message
  if (detail.firstUserMessage) {
    lines.push('{bold}{green-fg}First Message{/green-fg}{/bold}');
    lines.push(`{bold}Time:{/bold} ${formatTime(detail.firstUserMessage.timestamp)}`);
    lines.push('');

    // Wrap message content
    const firstMsgLines = wrapText(detail.firstUserMessage.content, screen.width - 8);
    firstMsgLines.forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
  }

  // Last user message (if different from first)
  if (detail.lastUserMessage && detail.lastUserMessage.uuid !== detail.firstUserMessage?.uuid) {
    lines.push('{bold}{magenta-fg}Last Message{/magenta-fg}{/bold}');
    lines.push(`{bold}Time:{/bold} ${formatTime(detail.lastUserMessage.timestamp)}`);
    lines.push('');

    // Wrap message content
    const lastMsgLines = wrapText(detail.lastUserMessage.content, screen.width - 8);
    lastMsgLines.forEach(line => {
      lines.push(`  ${line}`);
    });
    lines.push('');
  }

  lines.push('');
  lines.push('{gray-fg}Press ESC or q to go back{/gray-fg}');

  } catch (err) {
    // If content building fails, show minimal error view
    lines = [
      '{bold}{red-fg}Error rendering session{/red-fg}{/bold}',
      '',
      `Error: ${err.message}`,
      '',
      `{bold}Session ID:{/bold} ${detail.sessionId}`,
      `{bold}Project:{/bold} ${formatPath(detail.projectPath)}`,
      '',
      '{gray-fg}Press ESC or q to go back{/gray-fg}'
    ];
  }

  // Create scrollable box
  const detailBox = blessed.box({
    top: 3,
    left: 0,
    width: '100%',
    height: '100%-4',
    content: lines.join('\n'),
    tags: true,
    keys: true,
    vi: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'gray'
      },
      style: {
        inverse: true
      }
    },
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'cyan'
      }
    },
    padding: {
      left: 1,
      right: 1
    }
  });

  // Navigation
  detailBox.key(['j'], () => {
    detailBox.scroll(1);
    screen.render();
  });

  detailBox.key(['k'], () => {
    detailBox.scroll(-1);
    screen.render();
  });

  detailBox.key(['g'], () => {
    detailBox.setScrollPerc(0);
    screen.render();
  });

  detailBox.key(['G'], () => {
    detailBox.setScrollPerc(100);
    screen.render();
  });

  detailBox.key(['pagedown'], () => {
    detailBox.scroll(10);
    screen.render();
  });

  detailBox.key(['pageup'], () => {
    detailBox.scroll(-10);
    screen.render();
  });

  // Back navigation
  detailBox.key(['escape', 'q', 'left'], () => {
    screen.remove(detailBox);
    onBack();
    screen.render();
  });

  screen.append(detailBox);
  detailBox.focus();
  screen.render();

  return detailBox;
}

module.exports = {
  createDetailView
};

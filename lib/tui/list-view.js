const blessed = require('blessed');
const { formatSessionListItem, getRecencyColor } = require('./utils');
const { exec } = require('child_process');
const os = require('os');

/**
 * Copy text to system clipboard (non-blocking)
 */
function copyToClipboard(text, screen) {
  const platform = os.platform();
  let cmd;

  if (platform === 'darwin') {
    cmd = 'pbcopy';
  } else if (platform === 'linux') {
    cmd = 'xclip -selection clipboard';
  } else if (platform === 'win32') {
    cmd = 'clip';
  } else {
    showNotification(screen, `Clipboard not supported on ${platform}`, 'red');
    return;
  }

  // Use async exec to avoid blocking
  const child = exec(cmd, (error) => {
    if (error) {
      // Try fallback for Linux
      if (platform === 'linux') {
        exec('xsel --clipboard --input', (err2) => {
          if (err2) {
            showNotification(screen, `Copy failed: Install xclip or xsel`, 'red');
          } else {
            showNotification(screen, `Copied: ${text}`, 'green');
          }
        }).stdin.end(text);
      } else {
        showNotification(screen, `Copy failed: ${error.message}`, 'red');
      }
    } else {
      showNotification(screen, `Copied: ${text}`, 'green');
    }
  });

  // Write to stdin if child process started
  if (child.stdin) {
    child.stdin.write(text);
    child.stdin.end();
  }
}

/**
 * Show temporary notification
 */
function showNotification(screen, message, color = 'yellow') {
  const notification = blessed.box({
    top: 'center',
    left: 'center',
    width: message.length + 4,
    height: 3,
    content: ` ${message}`,
    style: {
      fg: 'black',
      bg: color
    },
    border: {
      type: 'line',
      fg: color
    }
  });

  screen.append(notification);
  screen.render();

  setTimeout(() => {
    screen.remove(notification);
    screen.render();
  }, 1500);
}

/**
 * Create session list view
 */
function createListView(screen, sessions) {
  // Group sessions by project
  const grouped = new Map();
  sessions.forEach(session => {
    if (!grouped.has(session.project)) {
      grouped.set(session.project, []);
    }
    grouped.get(session.project).push(session);
  });

  // Build list items with project headers
  const items = [];
  const sessionMap = new Map(); // Map list index to session

  let itemIndex = 0;
  Array.from(grouped.entries())
    .sort(([, a], [, b]) => {
      // Sort by most recent session in project
      const aLatest = Math.max(...a.map(s => s.lastTimestamp));
      const bLatest = Math.max(...b.map(s => s.lastTimestamp));
      return bLatest - aLatest;
    })
    .forEach(([project, projectSessions]) => {
      // Add project header
      const sessionCount = projectSessions.length;
      const totalMessages = projectSessions.reduce((sum, s) => sum + s.messageCount, 0);
      items.push({
        content: `{bold}{cyan-fg}${project}{/cyan-fg}{/bold} (${sessionCount} sessions, ${totalMessages} messages)`,
        isHeader: true
      });
      itemIndex++;

      // Add sessions under this project
      projectSessions
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
        .forEach(session => {
          const color = getRecencyColor(session.lastTimestamp);
          const formatted = formatSessionListItem(session);
          items.push({
            content: `  {${color}-fg}${formatted}{/${color}-fg}`,
            isHeader: false
          });
          sessionMap.set(itemIndex, session);
          itemIndex++;
        });
    });

  const list = blessed.list({
    top: 3,
    left: 0,
    width: '100%',
    height: '100%-4',
    items: items.map(i => i.content),
    tags: true,
    keys: true,
    vi: true,
    mouse: true,
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'gray'
      },
      style: {
        inverse: true
      }
    },
    style: {
      selected: {
        bg: 'blue',
        fg: 'white',
        bold: true
      }
    },
    border: {
      type: 'line'
    }
  });

  // Helper to navigate down, skipping headers
  const navigateDown = (step = 1) => {
    const current = list.selected;
    let next = current + step;

    // Skip headers when moving down
    while (next < items.length && items[next]?.isHeader) {
      next++;
    }

    if (next < items.length) {
      list.select(next);
    }
    screen.render();
  };

  // Helper to navigate up, skipping headers
  const navigateUp = (step = 1) => {
    const current = list.selected;
    let next = current - step;

    // Skip headers when moving up
    while (next >= 0 && items[next]?.isHeader) {
      next--;
    }

    if (next >= 0) {
      list.select(next);
    }
    screen.render();
  };

  // Navigation keybindings
  list.key(['j', 'down'], () => {
    navigateDown(1);
  });

  list.key(['k', 'up'], () => {
    navigateUp(1);
  });

  list.key(['g'], () => {
    // Go to first non-header
    let first = 0;
    while (first < items.length && items[first]?.isHeader) {
      first++;
    }
    list.select(first);
    screen.render();
  });

  list.key(['G'], () => {
    // Go to last non-header
    let last = items.length - 1;
    while (last >= 0 && items[last]?.isHeader) {
      last--;
    }
    list.select(last);
    screen.render();
  });

  list.key(['pagedown'], () => {
    navigateDown(10);
  });

  list.key(['pageup'], () => {
    navigateUp(10);
  });

  // Copy path to clipboard
  list.key(['c'], () => {
    const index = list.selected;
    if (!items[index].isHeader) {
      const session = sessionMap.get(index);
      if (session) {
        copyToClipboard(session.project, screen);
      }
    }
  });

  // Prevent selecting headers
  list.on('select item', (item, index) => {
    if (items[index].isHeader) {
      // Skip to next non-header
      const nextIndex = index + 1;
      if (nextIndex < items.length && !items[nextIndex].isHeader) {
        list.select(nextIndex);
        screen.render();
      }
    }
  });

  // Enter key - cd to directory and exit
  list.onEnter = (callback) => {
    list.on('select', (item, index) => {
      // Only trigger for non-headers
      if (!items[index].isHeader) {
        const session = sessionMap.get(index);
        if (session) {
          callback(session);
        }
      }
    });
  };

  // Right arrow - view session details
  list.onViewDetails = (callback) => {
    list.key(['right'], () => {
      const index = list.selected;
      if (!items[index].isHeader) {
        const session = sessionMap.get(index);
        if (session) {
          callback(session);
        }
      }
    });
  };

  screen.append(list);
  list.focus();

  // Start on first non-header item
  let firstSession = 0;
  while (firstSession < items.length && items[firstSession]?.isHeader) {
    firstSession++;
  }
  if (firstSession < items.length) {
    list.select(firstSession);
  }

  return list;
}

module.exports = {
  createListView
};

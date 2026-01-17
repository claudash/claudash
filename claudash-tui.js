#!/usr/bin/env node

const fs = require('fs');
const sessionLoader = require('./lib/session-loader');
const { createScreen, createHeader, createFooter, showHelp } = require('./lib/tui/screen');
const { createListView } = require('./lib/tui/list-view');
const { createDetailView } = require('./lib/tui/detail-view');

// Parse command line arguments
const args = process.argv.slice(2);

// Check for --list flag to show CLI version
if (args.includes('--list') || args.includes('-l')) {
  // Run the CLI version instead
  const cliPath = require.resolve('./claudash.js');
  const limit = args.find(arg => !arg.startsWith('-'));
  const cliArgs = limit ? [limit] : [];

  require('child_process').spawnSync('node', [cliPath, ...cliArgs], {
    stdio: 'inherit'
  });
  process.exit(0);
}

// Check for --output-cd flag
const outputCdIndex = args.indexOf('--output-cd');
const outputCdFile = outputCdIndex !== -1 ? args[outputCdIndex + 1] : null;

async function main() {
  try {
    // 1. Build session index from history.jsonl
    console.log('Loading sessions...');
    const sessions = sessionLoader.buildSessionIndex();
    console.log(`Found ${sessions.length} sessions`);

    if (sessions.length === 0) {
      console.log('No sessions found in ~/.claude/history.jsonl');
      return;
    }

    // 2. Initialize TUI
    const screen = createScreen();
    const header = createHeader(screen);
    const footer = createFooter(screen);

    // 3. Create session list
    const listView = createListView(screen, sessions);

    // Help keybinding
    screen.key(['?'], () => {
      showHelp(screen);
    });

    // 4. Handle Enter/Right arrow - view session details
    const viewSessionDetails = async (session) => {
      try {
        // Show loading indicator
        const loadingBox = require('blessed').box({
          top: 'center',
          left: 'center',
          width: 30,
          height: 3,
          content: ' Loading session details...',
          border: {
            type: 'line'
          },
          style: {
            fg: 'yellow',
            border: {
              fg: 'yellow'
            }
          }
        });
        screen.append(loadingBox);
        screen.render();

        // Load full session detail
        const detail = sessionLoader.getSessionDetail(session.sessionId, session.project);

        // Remove loading indicator
        screen.remove(loadingBox);

        // Hide list view
        screen.remove(listView);

        // Show detail view
        createDetailView(screen, detail, () => {
          // Restore list view
          screen.append(listView);
          listView.focus();
        });
      } catch (err) {
        // Remove loading indicator if it exists
        screen.children.forEach(child => {
          if (child.content && child.content.includes('Loading')) {
            screen.remove(child);
          }
        });

        // Show error
        const errorBox = require('blessed').box({
          top: 'center',
          left: 'center',
          width: '50%',
          height: 5,
          content: ` Error loading session: ${err.message}`,
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

        errorBox.key(['escape', 'q', 'enter'], () => {
          screen.remove(errorBox);
          screen.append(listView);
          listView.focus();
          screen.render();
        });

        screen.render();
      }
    };

    // Set up Enter and Right arrow to view details
    listView.onEnter(viewSessionDetails);
    listView.onViewDetails(viewSessionDetails);

    // 5. Initial render
    screen.render();
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();

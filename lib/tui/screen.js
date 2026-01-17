const blessed = require('blessed');

/**
 * Create and configure the main blessed screen
 */
function createScreen() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'ClauDash - Claude Code Session Dashboard',
    fullUnicode: true
  });

  // Global keybindings
  screen.key(['escape', 'q', 'C-c'], () => {
    return process.exit(0);
  });

  return screen;
}

/**
 * Create header box
 */
function createHeader(screen) {
  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ' {bold}ClauDash{/bold} - Claude Code Session Dashboard\n Press {cyan-fg}?{/cyan-fg} for help | {cyan-fg}q{/cyan-fg} to quit',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue',
      bold: true
    }
  });

  screen.append(header);
  return header;
}

/**
 * Create footer with keybindings
 */
function createFooter(screen) {
  const footer = blessed.box({
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    content: ' {cyan-fg}↑↓{/cyan-fg}/j/k: Navigate | {cyan-fg}Enter{/cyan-fg}/→: Details | {cyan-fg}c{/cyan-fg}: Copy path | {cyan-fg}q{/cyan-fg}: Quit',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });

  screen.append(footer);
  return footer;
}

/**
 * Show help overlay
 */
function showHelp(screen) {
  const helpBox = blessed.box({
    top: 'center',
    left: 'center',
    width: '60%',
    height: '60%',
    content: `
{bold}ClauDash - Keyboard Shortcuts{/bold}

{cyan-fg}Navigation{/cyan-fg}
  ↑/k         Move up
  ↓/j         Move down
  PageUp      Page up
  PageDown    Page down
  g           Go to top
  G           Go to bottom
  Home        Go to top
  End         Go to bottom

{cyan-fg}Actions{/cyan-fg}
  Enter/→     View session details
  c           Copy project path to clipboard
  ←/Escape    Go back / Close

{cyan-fg}General{/cyan-fg}
  ?           Show this help
  q           Quit
  Ctrl+C      Quit

Press any key to close...
    `,
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'cyan'
      }
    },
    padding: {
      left: 2,
      right: 2
    }
  });

  screen.append(helpBox);
  helpBox.focus();

  helpBox.key(['escape', 'q', 'enter', 'space'], () => {
    screen.remove(helpBox);
    screen.render();
  });

  screen.render();
}

module.exports = {
  createScreen,
  createHeader,
  createFooter,
  showHelp
};

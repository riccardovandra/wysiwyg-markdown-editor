/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webview/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        'dark': {
          'base': 'var(--color-bg-base)',
          'elevated': 'var(--color-bg-elevated)',
          'surface': 'var(--color-bg-surface)',
          'hover': 'var(--color-bg-hover)',
          'active': 'var(--color-bg-active)',
        },
        'text': {
          'primary': 'var(--color-text-primary)',
          'secondary': 'var(--color-text-secondary)',
          'muted': 'var(--color-text-muted)',
          'heading': 'var(--color-text-heading)',
        },
        'accent': {
          DEFAULT: 'var(--color-accent-primary)',
          'hover': 'var(--color-accent-hover)',
          'muted': 'var(--color-accent-muted)',
          'bg': 'var(--color-accent-bg)',
        },
        'border': {
          'subtle': 'var(--color-border-subtle)',
          'default': 'var(--color-border-default)',
          'panel': 'var(--color-border-panel)',
          'emphasis': 'var(--color-border-emphasis)',
        },
        'focus': {
          'border': 'var(--color-focus-border)',
        },
        // Keep VS Code fallbacks for compatibility
        'vscode-bg': 'var(--color-bg-base)',
        'vscode-fg': 'var(--color-text-primary)',
        'vscode-border': 'var(--color-border-default)',
        'vscode-button-bg': 'var(--color-accent-primary)',
        'vscode-button-fg': '#ffffff',
        'vscode-input-bg': 'var(--color-bg-surface)',
        'vscode-input-fg': 'var(--color-text-primary)',
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

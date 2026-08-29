/**
 * Messages sent FROM WebView TO Extension
 */
export type WebViewMessage =
  | { type: 'ready' }
  | { type: 'contentChanged'; markdown: string }
  | { type: 'contentFlushed' }
  | { type: 'linkClicked'; href: string };

/**
 * Settings passed from extension to WebView
 */
export interface EditorSettings {
  hideToolbar?: boolean;
  showCard?: boolean;
  showComments?: boolean;
  contentPadding?: 'compact' | 'medium' | 'spacious';
  textSize?: 'small' | 'medium' | 'large';
  lineHeight?: 'tight' | 'compact' | 'normal' | 'relaxed';
  accentTheme?: 'indigo' | 'blue' | 'purple' | 'teal' | 'neutral';
  disableBoldAccentColor?: boolean;
  // Extension-controlled font settings
  fontFamily?: string;
  fontSize?: number;
  lineHeightMultiplier?: number;
}

/**
 * Messages sent FROM Extension TO WebView
 */
export type ExtensionMessage =
  | { type: 'init'; content: string; settings?: EditorSettings; documentBaseUri: string }
  | { type: 'externalChange'; content: string; documentBaseUri: string }
  | { type: 'flushContent' }
  | { type: 'settingsUpdate'; settings: EditorSettings };

/**
 * All possible message types for type guards
 */
export type Message = WebViewMessage | ExtensionMessage;

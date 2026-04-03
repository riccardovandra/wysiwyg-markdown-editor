import * as vscode from 'vscode';
import { VIEW_TYPE, EXTENSION_NAME } from '../shared/constants';
import { outputChannel } from './outputChannel';
import { editorRegistry } from './editorRegistry';
import { cooldownManager } from './cooldownManager';
import { handleLinkClick } from './linkHandler';
import type { EditorSettings } from '../shared/messages.types';

/**
 * Type guard for tab input with URI.
 */
function isTabInputWithUri(input: unknown): input is { uri: vscode.Uri } {
	return input !== null &&
		typeof input === 'object' &&
		'uri' in input &&
		(input as { uri: unknown }).uri instanceof vscode.Uri;
}

/**
 * Closes any related text editor tabs for a given document URI.
 * Called when the WYSIWYG editor is disposed to clean up orphaned text tabs.
 *
 * @param documentUri - The string URI of the document being closed
 */
async function closeRelatedTextEditors(documentUri: string): Promise<void> {
	try {
		// Find all tabs across all tab groups
		const allTabs = vscode.window.tabGroups.all.flatMap(group =>
			group.tabs.map(tab => ({ tab, group }))
		);

		// Find text editor tabs with matching URI (exclude custom editors)
		// TabInputText has only 'uri', TabInputCustom has 'uri' AND 'viewType'
		const tabsToClose = allTabs.filter(({ tab }) => {
			if (isTabInputWithUri(tab.input)) {
				const input = tab.input as { uri: vscode.Uri; viewType?: string };
				// Only close if it's NOT a custom editor (no viewType = text editor)
				if (!('viewType' in tab.input)) {
					return input.uri.toString() === documentUri;
				}
			}
			return false;
		});

		// Close each matching tab
		for (const { tab } of tabsToClose) {
			await vscode.window.tabGroups.close(tab);
			outputChannel.log(`Closed related text editor tab for: ${documentUri}`);
		}

		if (tabsToClose.length === 0) {
			outputChannel.log(`No related text editor tabs to close for: ${documentUri}`);
		}
	} catch (error) {
		// Graceful handling - log but don't throw (AC: #3)
		outputChannel.log(`Error closing related tabs: ${error}`);
	}
}

/**
 * Reads all editor settings from VS Code configuration.
 */
function getEditorSettings(): EditorSettings {
	const config = vscode.workspace.getConfiguration('markdownWysiwyg');
	return {
		hideToolbar: config.get<boolean>('hideToolbar', false),
		showCard: config.get<boolean>('showCard', true),
		contentPadding: config.get<'compact' | 'medium' | 'spacious'>('contentPadding', 'medium'),
		textSize: config.get<'small' | 'medium' | 'large'>('textSize', 'medium'),
		lineHeight: config.get<'tight' | 'compact' | 'normal' | 'relaxed'>('lineHeight', 'normal'),
		accentTheme: config.get<'indigo' | 'blue' | 'purple' | 'teal' | 'neutral'>('accentTheme', 'indigo'),
		disableBoldAccentColor: config.get<boolean>('disableBoldAccentColor', false),
		fontFamily: config.get<string>('fontFamily', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"),
		fontSize: config.get<number>('fontSize', 16),
		lineHeightMultiplier: config.get<number>('lineHeightMultiplier', 1.75),
	};
}

/**
 * CustomTextEditorProvider for Markdown WYSIWYG editing.
 * Provides a rich text editing experience for .md files using a WebView.
 */
export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = VIEW_TYPE;

	constructor(private readonly context: vscode.ExtensionContext) {}

	/**
	 * Resolves a custom text editor for a markdown document.
	 * Called when VS Code needs to create an editor for a .md file.
	 */
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		outputChannel.log(`Opening custom editor for: ${document.uri.fsPath}`);

		// Track if the edit was initiated by us to avoid circular updates
		let isOwnEdit = false;

		// Promise resolver for flush completion
		let flushResolve: (() => void) | null = null;

		// Configure WebView options
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')
			]
		};

		// Set initial HTML content
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		// Register document in editor registry for lifecycle coordination
		const documentUri = document.uri.toString();
		editorRegistry.register(documentUri, webviewPanel);

		/**
		 * Updates the TextDocument with new content from the WebView.
		 * Uses WorkspaceEdit for proper VS Code document editing.
		 */
		const updateDocument = async (newContent: string): Promise<void> => {
			const edit = new vscode.WorkspaceEdit();
			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(document.getText().length)
			);
			edit.replace(document.uri, fullRange, newContent);

			isOwnEdit = true;
			try {
				await vscode.workspace.applyEdit(edit);
				outputChannel.log(`Document updated with ${newContent.length} characters`);
			} catch (error) {
				outputChannel.log(`Failed to update document: ${error}`);
			} finally {
				isOwnEdit = false;
			}
		};

		/**
		 * Flushes any pending WebView changes before save.
		 * Sends a message to the WebView requesting immediate sync,
		 * then waits for confirmation or times out.
		 */
		const flushPendingChanges = async (): Promise<void> => {
			outputChannel.log('Flushing pending changes before save');

			// Create a promise that resolves when WebView confirms flush
			const flushPromise = new Promise<void>((resolve) => {
				flushResolve = resolve;
			});

			// Request WebView to flush content immediately
			webviewPanel.webview.postMessage({ type: 'flushContent' });

			// Wait for flush with timeout (100ms should be plenty)
			const timeoutPromise = new Promise<void>((resolve) => {
				setTimeout(() => {
					outputChannel.log('Flush timeout - proceeding with save');
					resolve();
				}, 100);
			});

			await Promise.race([flushPromise, timeoutPromise]);
			flushResolve = null;
		};

		// Handle messages from the WebView
		webviewPanel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case 'ready': {
						outputChannel.log('WebView ready');
						// Read all settings
						const settings = getEditorSettings();
						// Send initial content and settings to WebView
						const content = document.getText();
						webviewPanel.webview.postMessage({
							type: 'init',
							content: content,
							settings
						});
						outputChannel.log(`Sent init message with ${content.length} characters, settings: ${JSON.stringify(settings)}`);
						return;
					}

					case 'contentChanged':
						outputChannel.log('Content changed in WebView');
						await updateDocument(message.markdown);
						return;

					case 'contentFlushed':
						outputChannel.log('Content flush confirmed by WebView');
						if (flushResolve) {
							flushResolve();
						}
						return;

					case 'linkClicked':
						// Handle link navigation from WebView (Story 11.1)
						await handleLinkClick(message.href, document.uri);
						return;
				}
			},
			undefined,
			this.context.subscriptions
		);

		// Flush pending changes before save
		const willSaveSubscription = vscode.workspace.onWillSaveTextDocument((e) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				outputChannel.log('Save triggered - flushing pending changes');
				e.waitUntil(flushPendingChanges());
			}
		});

		// Listen for external document changes
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
			if (e.document.uri.toString() === document.uri.toString()) {
				// Skip if this change was initiated by our own edit
				if (isOwnEdit) {
					return;
				}
				// External change detected - notify WebView
				outputChannel.log('External document change detected');
				webviewPanel.webview.postMessage({
					type: 'externalChange',
					content: e.document.getText()
				});
			}
		});

		// Listen for configuration changes - send settings updates in real-time
		const configChangeSubscription = vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('markdownWysiwyg')) {
				const settings = getEditorSettings();
				outputChannel.log(`Settings changed: ${JSON.stringify(settings)}`);
				webviewPanel.webview.postMessage({
					type: 'settingsUpdate',
					settings
				});
			}
		});

		// Clean up subscriptions when panel is disposed
		webviewPanel.onDidDispose(() => {
			// Unregister from registry FIRST to prevent race conditions with auto-open
			editorRegistry.unregister(documentUri);

			// Mark as recently closed to prevent auto-open loop (Story 10.3)
			// Must happen BEFORE tab closure so cooldown is set when user clicks remaining tab
			cooldownManager.markRecentlyClosed(documentUri);

			// Close related text editor tabs (fire and forget - don't block disposal)
			// This ensures orphaned text tabs are cleaned up when WYSIWYG editor closes
			closeRelatedTextEditors(documentUri);

			willSaveSubscription.dispose();
			changeDocumentSubscription.dispose();
			configChangeSubscription.dispose();
		});
	}

	/**
	 * Generates the HTML content for the WebView.
	 * Loads the Vite-built React application with proper CSP.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Get URIs for Vite build output
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'index.css')
		);

		// Generate nonce for script security
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'strict-dynamic'; font-src ${webview.cspSource};">
	<link href="${styleUri}" rel="stylesheet">
	<title>${EXTENSION_NAME}</title>
</head>
<body>
	<div id="root"></div>
	<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}
}

/**
 * Generate a random nonce string for CSP script security.
 * @returns A 32-character random alphanumeric string
 */
function getNonce(): string {
	let text = '';
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return text;
}

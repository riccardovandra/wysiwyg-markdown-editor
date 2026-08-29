import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './editorProvider';
import { outputChannel } from './outputChannel';
import { editorRegistry } from './editorRegistry';
import { cooldownManager } from './cooldownManager';

// Re-export editorRegistry for external module access
export { editorRegistry };

// Constants
const AUTO_OPEN_DELAY_MS = 100; // Delay to avoid interfering with rapid tab switches

// Track active timeout for cleanup
let autoOpenTimeout: NodeJS.Timeout | undefined;

// Type guard for tab input with URI
function isTabInputWithUri(input: unknown): input is { uri: vscode.Uri } {
	return input !== null &&
		typeof input === 'object' &&
		'uri' in input &&
		(input as { uri: unknown }).uri instanceof vscode.Uri;
}

// Type guard for custom editor tab input
function isCustomEditorTabInput(input: unknown): input is { uri: vscode.Uri; viewType: string } {
	return isTabInputWithUri(input) &&
		'viewType' in input &&
		typeof (input as { viewType: unknown }).viewType === 'string';
}

/**
 * Closes the text editor tab for a given document URI.
 * Used by auto-open to replace text tab with WYSIWYG tab.
 * Only closes TabInputText tabs, not custom editor tabs.
 */
async function closeTextEditorTabForUri(uri: vscode.Uri): Promise<void> {
	try {
		const allTabs = vscode.window.tabGroups.all.flatMap(group =>
			group.tabs.map(tab => ({ tab, group }))
		);

		// Find text editor tab with matching URI
		// TabInputText has only 'uri', TabInputCustom has 'uri' AND 'viewType'
		const textTab = allTabs.find(({ tab }) => {
			if (isTabInputWithUri(tab.input)) {
				// Only match text editor tabs (no viewType property)
				if (!('viewType' in tab.input)) {
					return tab.input.uri.toString() === uri.toString();
				}
			}
			return false;
		});

		if (textTab) {
			await vscode.window.tabGroups.close(textTab.tab);
			outputChannel.log(`Auto-open: Closed text editor tab for ${uri.fsPath}`);
		}
	} catch (error) {
		// Graceful handling - log but don't throw (don't break auto-open)
		outputChannel.log(`Auto-open: Error closing text tab: ${error}`);
	}
}

export function activate(context: vscode.ExtensionContext) {
	outputChannel.log('Markdown WYSIWYG Editor activated');

	// Register the custom editor provider for markdown files
	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			MarkdownEditorProvider.viewType,
			new MarkdownEditorProvider(context),
			{
				supportsMultipleEditorsPerDocument: false,
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		)
	);

	// Helper to check if a document is in a visible tab (user-initiated open)
	function isDocumentInVisibleTab(uri: vscode.Uri): boolean {
		const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
		return tabs.some(tab => {
			if (isTabInputWithUri(tab.input)) {
				return tab.input.uri.toString() === uri.toString();
			}
			return false;
		});
	}

	// Auto-open markdown files in WYSIWYG editor when setting is enabled
	// Uses onDidChangeActiveTextEditor instead of onDidOpenTextDocument to only
	// trigger when user explicitly opens a file (not when tools read files in background)
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(async (editor) => {
			if (!editor) return;

			const config = vscode.workspace.getConfiguration('markdownWysiwyg');
			const autoOpen = config.get<boolean>('autoOpen', false);

			if (!autoOpen) return;
			if (!editor.document.fileName.endsWith('.md')) return;

			// Verify the file is actually visible in a tab (not background opened)
			if (!isDocumentInVisibleTab(editor.document.uri)) return;

			// Clear any pending timeout (debounce rapid file switches)
			if (autoOpenTimeout) {
				clearTimeout(autoOpenTimeout);
			}

			// Small delay to avoid interfering with rapid tab switches
			autoOpenTimeout = setTimeout(async () => {
				autoOpenTimeout = undefined;

				// Re-verify the editor is still active after delay
				const currentEditor = vscode.window.activeTextEditor;
				if (currentEditor?.document.uri.toString() !== editor.document.uri.toString()) {
					return;
				}

				// Check if already open in our custom editor (avoid infinite loops)
				const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
				const isAlreadyInWysiwyg = tabs.some(tab => {
					if (isCustomEditorTabInput(tab.input)) {
						return tab.input.viewType === 'markdownWysiwyg.editor' &&
							tab.input.uri.toString() === editor.document.uri.toString();
					}
					return false;
				});

				if (isAlreadyInWysiwyg) return;

				// Check if document is in cooldown (recently closed from WYSIWYG)
				// This prevents auto-open loops when user closes WYSIWYG and clicks text tab
				if (cooldownManager.isInCooldown(editor.document.uri.toString())) {
					outputChannel.log(`Auto-open blocked by cooldown: ${editor.document.uri.fsPath}`);
					return;
				}

				await vscode.commands.executeCommand(
					'vscode.openWith',
					editor.document.uri,
					'markdownWysiwyg.editor'
				);

				// Close the text editor tab that triggered auto-open (Story 10.4)
				// Sequential execution ensures WYSIWYG tab is open before closing text tab
				await closeTextEditorTabForUri(editor.document.uri);
			}, AUTO_OPEN_DELAY_MS);
		})
	);

	// Listen for configuration changes (supports both user and workspace level settings)
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('markdownWysiwyg.autoOpen')) {
				const config = vscode.workspace.getConfiguration('markdownWysiwyg');
				const autoOpen = config.get<boolean>('autoOpen', false);
				outputChannel.log(`Auto-open setting changed to: ${autoOpen}`);
			}
		})
	);

	// Register open editor command for context menu and command palette
	// NOTE: This manual command intentionally bypasses cooldown (AC #4 in Story 10.3)
	// Users should always be able to manually open the visual editor via command palette
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownWysiwyg.openEditor', async (uri?: vscode.Uri) => {
			// If no URI provided (command palette), try to get from active editor
			if (!uri) {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor && activeEditor.document.fileName.endsWith('.md')) {
					uri = activeEditor.document.uri;
				}
			}

			// Handle case when no markdown file is selected
			if (!uri) {
				vscode.window.showWarningMessage('No markdown file selected');
				return;
			}

			// Handle case when non-md file is somehow triggered
			if (!uri.fsPath.endsWith('.md')) {
				vscode.window.showWarningMessage('Selected file is not a markdown file');
				return;
			}

			// Open the file in the custom editor
			try {
				await vscode.commands.executeCommand(
					'vscode.openWith',
					uri,
					'markdownWysiwyg.editor'
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				vscode.window.showErrorMessage(`Failed to open markdown file: ${message}`);
			}
		})
	);

	// Copy the agent protocol for applying comments (see resources/agent-comments-protocol.md)
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownWysiwyg.copyAgentInstructions', () =>
			copyAgentInstructions(context)
		)
	);

	// Register open text editor command (switch from visual editor back to text)
	context.subscriptions.push(
		vscode.commands.registerCommand('markdownWysiwyg.openTextEditor', async (uri?: vscode.Uri) => {
			// If no URI provided, this command is triggered from editor title menu
			// which should pass the resource URI
			if (!uri) {
				vscode.window.showWarningMessage('No markdown file selected');
				return;
			}

			// Open the file in the default text editor
			try {
				await vscode.commands.executeCommand(
					'vscode.openWith',
					uri,
					'default'
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown error';
				vscode.window.showErrorMessage(`Failed to open text editor: ${message}`);
			}
		})
	);
}

/**
 * Copies the agent protocol for applying comments to the clipboard, so it can
 * be pasted into a CLAUDE.md, a skill, or a one-off prompt.
 */
export async function copyAgentInstructions(context: vscode.ExtensionContext): Promise<void> {
	const uri = vscode.Uri.joinPath(context.extensionUri, 'resources', 'agent-comments-protocol.md');
	try {
		const text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8');
		await vscode.env.clipboard.writeText(text);
		vscode.window.showInformationMessage('Agent instructions for comments copied to the clipboard.');
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		vscode.window.showErrorMessage(`Could not read agent instructions: ${message}`);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Clean up any pending auto-open timeout
	if (autoOpenTimeout) {
		clearTimeout(autoOpenTimeout);
		autoOpenTimeout = undefined;
	}

	// Clean up cooldown manager timers
	cooldownManager.dispose();

	outputChannel.dispose();
}

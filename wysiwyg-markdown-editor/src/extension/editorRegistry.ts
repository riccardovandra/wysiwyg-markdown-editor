import * as vscode from 'vscode';
import { outputChannel } from './outputChannel';

/**
 * Tracks which documents have open WYSIWYG editors.
 * Used for lifecycle coordination between editor types.
 */
class EditorRegistry {
	private registry = new Map<string, vscode.WebviewPanel>();

	/**
	 * Register a document URI with its WebviewPanel.
	 */
	register(uri: string, panel: vscode.WebviewPanel): void {
		this.registry.set(uri, panel);
		outputChannel.log(`EditorRegistry: Registered ${uri}`);
	}

	/**
	 * Unregister a document URI when its panel is disposed.
	 */
	unregister(uri: string): boolean {
		const result = this.registry.delete(uri);
		outputChannel.log(`EditorRegistry: Unregistered ${uri} (found: ${result})`);
		return result;
	}

	/**
	 * Get the WebviewPanel for a document URI.
	 */
	get(uri: string): vscode.WebviewPanel | undefined {
		return this.registry.get(uri);
	}

	/**
	 * Check if a document URI has an open editor.
	 */
	has(uri: string): boolean {
		return this.registry.has(uri);
	}

	/**
	 * Get the number of tracked editors.
	 */
	get size(): number {
		return this.registry.size;
	}

	/**
	 * Get all entries for debugging/iteration.
	 */
	entries(): IterableIterator<[string, vscode.WebviewPanel]> {
		return this.registry.entries();
	}
}

export const editorRegistry = new EditorRegistry();

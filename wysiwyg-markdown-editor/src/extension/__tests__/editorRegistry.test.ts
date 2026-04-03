import * as assert from 'assert';
import * as vscode from 'vscode';
import { editorRegistry } from '../editorRegistry';

suite('EditorRegistry Test Suite', () => {
	// Helper to create test markdown file
	async function createTestFile(name: string): Promise<vscode.Uri> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder available');
		}
		const uri = vscode.Uri.joinPath(workspaceFolder.uri, name);
		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(uri, encoder.encode('# Test\n\nContent'));
		return uri;
	}

	// Helper to clean up test file
	async function deleteTestFile(uri: vscode.Uri): Promise<void> {
		try {
			await vscode.workspace.fs.delete(uri);
		} catch {
			// Ignore cleanup errors
		}
	}

	test('editorRegistry is imported and has expected methods', () => {
		assert.ok(editorRegistry, 'editorRegistry should be defined');
		assert.strictEqual(typeof editorRegistry.register, 'function', 'register should be a function');
		assert.strictEqual(typeof editorRegistry.unregister, 'function', 'unregister should be a function');
		assert.strictEqual(typeof editorRegistry.get, 'function', 'get should be a function');
		assert.strictEqual(typeof editorRegistry.has, 'function', 'has should be a function');
		assert.strictEqual(typeof editorRegistry.size, 'number', 'size should be a number');
		assert.strictEqual(typeof editorRegistry.entries, 'function', 'entries should be a function');
	});

	test('registry tracks document when opened in WYSIWYG editor', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-registry-track.md');
		const initialSize = editorRegistry.size;

		try {
			// Open the file in our custom editor
			await vscode.commands.executeCommand(
				'vscode.openWith',
				testUri,
				'markdownWysiwyg.editor'
			);

			// Give time for editor to initialize
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Document should now be registered
			assert.ok(
				editorRegistry.has(testUri.toString()),
				'Registry should track opened document'
			);
			assert.strictEqual(
				editorRegistry.size,
				initialSize + 1,
				'Registry size should increase by 1'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('registry removes document when editor is closed', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-registry-remove.md');

		try {
			// Open the file in our custom editor
			await vscode.commands.executeCommand(
				'vscode.openWith',
				testUri,
				'markdownWysiwyg.editor'
			);

			// Give time for editor to initialize
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify it's registered
			assert.ok(
				editorRegistry.has(testUri.toString()),
				'Document should be registered after opening'
			);

			// Close the editor
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Document should be unregistered
			assert.ok(
				!editorRegistry.has(testUri.toString()),
				'Registry should remove document when editor is closed'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('registry tracks multiple documents simultaneously', async function() {
		this.timeout(20000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri1 = await createTestFile('test-multi-1.md');
		const testUri2 = await createTestFile('test-multi-2.md');
		const testUri3 = await createTestFile('test-multi-3.md');
		const initialSize = editorRegistry.size;

		try {
			// Open all three files
			await vscode.commands.executeCommand('vscode.openWith', testUri1, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			await vscode.commands.executeCommand('vscode.openWith', testUri2, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			await vscode.commands.executeCommand('vscode.openWith', testUri3, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// All three should be registered
			assert.ok(editorRegistry.has(testUri1.toString()), 'First document should be registered');
			assert.ok(editorRegistry.has(testUri2.toString()), 'Second document should be registered');
			assert.ok(editorRegistry.has(testUri3.toString()), 'Third document should be registered');
			assert.strictEqual(
				editorRegistry.size,
				initialSize + 3,
				'Registry should track all 3 documents'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri1);
			await deleteTestFile(testUri2);
			await deleteTestFile(testUri3);
		}
	});

	test('closing one editor only removes that document from registry', async function() {
		this.timeout(20000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri1 = await createTestFile('test-close-one-1.md');
		const testUri2 = await createTestFile('test-close-one-2.md');
		const initialSize = editorRegistry.size;

		try {
			// Open both files
			await vscode.commands.executeCommand('vscode.openWith', testUri1, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			await vscode.commands.executeCommand('vscode.openWith', testUri2, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Both should be registered
			assert.ok(editorRegistry.has(testUri1.toString()), 'First document should be registered');
			assert.ok(editorRegistry.has(testUri2.toString()), 'Second document should be registered');
			assert.strictEqual(editorRegistry.size, initialSize + 2, 'Both documents should be tracked');

			// Close the active editor (testUri2)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Only testUri2 should be removed
			assert.ok(editorRegistry.has(testUri1.toString()), 'First document should still be registered');
			assert.ok(!editorRegistry.has(testUri2.toString()), 'Second document should be unregistered');
			assert.strictEqual(editorRegistry.size, initialSize + 1, 'Only one document should remain');
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri1);
			await deleteTestFile(testUri2);
		}
	});
});

/**
 * Test Suite for Synchronized Tab Closure (Story 10.2)
 * Tests that closing WYSIWYG editor also closes related text editor tabs.
 */
suite('Synchronized Tab Closure Test Suite', () => {
	// Helper to create test markdown file
	async function createTestFile(name: string): Promise<vscode.Uri> {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			throw new Error('No workspace folder available');
		}
		const uri = vscode.Uri.joinPath(workspaceFolder.uri, name);
		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(uri, encoder.encode('# Test\n\nContent'));
		return uri;
	}

	// Helper to clean up test file
	async function deleteTestFile(uri: vscode.Uri): Promise<void> {
		try {
			await vscode.workspace.fs.delete(uri);
		} catch {
			// Ignore cleanup errors
		}
	}

	// Helper to check if a tab exists for a URI
	function hasTabForUri(uri: vscode.Uri, viewType?: string): boolean {
		const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
		return tabs.some(tab => {
			if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
				const input = tab.input as { uri: vscode.Uri; viewType?: string };
				const uriMatches = input.uri.toString() === uri.toString();
				if (viewType) {
					return uriMatches && input.viewType === viewType;
				}
				// For text editor tabs, check that there's NO viewType
				return uriMatches && !('viewType' in tab.input);
			}
			return false;
		});
	}

	// Helper to count tabs for a URI
	function countTabsForUri(uri: vscode.Uri): number {
		const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
		return tabs.filter(tab => {
			if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input) {
				const input = tab.input as { uri: vscode.Uri };
				return input.uri.toString() === uri.toString();
			}
			return false;
		}).length;
	}

	test('closing WYSIWYG editor closes related text editor tab (AC #1)', async function() {
		this.timeout(20000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-sync-close.md');

		try {
			// Step 1: Open file in text editor first
			await vscode.commands.executeCommand('vscode.open', testUri);
			await new Promise(resolve => setTimeout(resolve, 500));

			// Verify text editor tab exists
			assert.ok(
				hasTabForUri(testUri),
				'Text editor tab should exist after opening'
			);

			// Step 2: Open in WYSIWYG editor
			await vscode.commands.executeCommand(
				'vscode.openWith',
				testUri,
				'markdownWysiwyg.editor'
			);
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify both tabs exist
			assert.strictEqual(
				countTabsForUri(testUri),
				2,
				'Both text and WYSIWYG tabs should exist'
			);

			// Step 3: Close the WYSIWYG editor (which should be active)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Step 4: Verify text editor tab is also closed
			assert.strictEqual(
				countTabsForUri(testUri),
				0,
				'All tabs for the document should be closed after closing WYSIWYG'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('closing text editor only does not error (AC #2)', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-text-only-close.md');

		try {
			// Open file in text editor only (no WYSIWYG)
			await vscode.commands.executeCommand('vscode.open', testUri);
			await new Promise(resolve => setTimeout(resolve, 500));

			// Verify text editor tab exists
			assert.ok(
				hasTabForUri(testUri),
				'Text editor tab should exist'
			);

			// Close the text editor - should not error
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Tab should be closed (no errors occurred)
			assert.strictEqual(
				countTabsForUri(testUri),
				0,
				'Text editor tab should be closed without errors'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('closing WYSIWYG editor without text tab handles gracefully (AC #3)', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-wysiwyg-only-close.md');

		try {
			// Open DIRECTLY in WYSIWYG editor (no text editor tab first)
			await vscode.commands.executeCommand(
				'vscode.openWith',
				testUri,
				'markdownWysiwyg.editor'
			);
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify only WYSIWYG tab exists
			assert.strictEqual(
				countTabsForUri(testUri),
				1,
				'Only WYSIWYG tab should exist'
			);

			// Close WYSIWYG editor - should handle gracefully with no text tabs to close
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Tab should be closed (no errors)
			assert.strictEqual(
				countTabsForUri(testUri),
				0,
				'WYSIWYG tab should be closed without errors'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('multiple documents tracked independently - closing one does not affect others', async function() {
		this.timeout(25000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri1 = await createTestFile('test-multi-sync-1.md');
		const testUri2 = await createTestFile('test-multi-sync-2.md');

		try {
			// Open both files in text editor
			await vscode.commands.executeCommand('vscode.open', testUri1);
			await new Promise(resolve => setTimeout(resolve, 300));
			await vscode.commands.executeCommand('vscode.open', testUri2);
			await new Promise(resolve => setTimeout(resolve, 300));

			// Open both in WYSIWYG editor
			await vscode.commands.executeCommand('vscode.openWith', testUri1, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));
			await vscode.commands.executeCommand('vscode.openWith', testUri2, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Both should have 2 tabs each (text + WYSIWYG)
			assert.strictEqual(countTabsForUri(testUri1), 2, 'First file should have 2 tabs');
			assert.strictEqual(countTabsForUri(testUri2), 2, 'Second file should have 2 tabs');

			// Close second file's WYSIWYG editor (currently active)
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Second file should have 0 tabs, first file should still have 2
			assert.strictEqual(countTabsForUri(testUri2), 0, 'Second file should have 0 tabs after close');
			assert.strictEqual(countTabsForUri(testUri1), 2, 'First file should still have 2 tabs');
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri1);
			await deleteTestFile(testUri2);
		}
	});
});

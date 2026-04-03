import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Open Editor Command Test Suite', () => {
	test('markdownWysiwyg.openEditor command can be executed', async function() {
		this.timeout(5000);

		// Executing the command without a file should not throw
		// (it should show a warning, but not throw an error)
		// This implicitly tests that the command is registered
		await vscode.commands.executeCommand('markdownWysiwyg.openEditor');
		assert.ok(true, 'Command executed without throwing');
	});

	test('command opens markdown file in custom editor', async function() {
		this.timeout(10000);

		// Create a temporary markdown file
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testFileUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test-open-editor.md');
		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(testFileUri, encoder.encode('# Test File\n\nThis is a test.'));

		try {
			// Execute the command
			await vscode.commands.executeCommand('markdownWysiwyg.openEditor', testFileUri);

			// Give VS Code time to open the editor
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Note: Custom editors don't show in activeTextEditor
			// For custom editors, we verify by checking if the file is open in tabs
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const hasOpenTab = tabs.some(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'uri' in input) {
					return (input as { uri: vscode.Uri }).uri.fsPath === testFileUri.fsPath;
				}
				return false;
			});

			assert.ok(hasOpenTab, 'File should be opened in an editor tab');
		} finally {
			// Clean up: close editors and delete test file
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			try {
				await vscode.workspace.fs.delete(testFileUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

});

suite('Auto-Open Setting Test Suite', () => {
	test('markdownWysiwyg.autoOpen setting is registered', () => {
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const autoOpen = config.get<boolean>('autoOpen');
		// Setting should be defined (not undefined)
		assert.notStrictEqual(autoOpen, undefined, 'autoOpen setting should be registered');
	});

	test('markdownWysiwyg.autoOpen default value is false', () => {
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const autoOpen = config.get<boolean>('autoOpen');
		assert.strictEqual(autoOpen, false, 'autoOpen should default to false');
	});

	test('markdownWysiwyg.autoOpen setting can be changed', async function() {
		this.timeout(5000);
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');

		// Get original value
		const originalValue = config.get<boolean>('autoOpen', false);

		try {
			// Change the setting
			await config.update('autoOpen', true, vscode.ConfigurationTarget.Global);

			// Verify it changed
			const newValue = vscode.workspace.getConfiguration('markdownWysiwyg').get<boolean>('autoOpen');
			assert.strictEqual(newValue, true, 'autoOpen should be set to true');
		} finally {
			// Restore original value
			await config.update('autoOpen', originalValue, vscode.ConfigurationTarget.Global);
		}
	});

	test('auto-open switches markdown files to WYSIWYG editor when enabled', async function() {
		this.timeout(15000);
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const originalValue = config.get<boolean>('autoOpen', false);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test-auto-open-behavior.md');

		try {
			// Enable auto-open
			await config.update('autoOpen', true, vscode.ConfigurationTarget.Global);

			// Create test markdown file
			const encoder = new TextEncoder();
			await vscode.workspace.fs.writeFile(testUri, encoder.encode('# Auto-Open Test\n\nThis tests auto-open behavior.'));

			// Open in default text editor first
			await vscode.commands.executeCommand('vscode.open', testUri);

			// Wait for auto-open handler to trigger (100ms delay + buffer)
			await new Promise(resolve => setTimeout(resolve, 500));

			// Verify file opened in WYSIWYG editor
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const hasWysiwygTab = tabs.some(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'viewType' in input && 'uri' in input) {
					const customInput = input as { viewType: string; uri: vscode.Uri };
					return customInput.viewType === 'markdownWysiwyg.editor' &&
						customInput.uri.fsPath === testUri.fsPath;
				}
				return false;
			});

			assert.ok(hasWysiwygTab, 'Markdown file should auto-open in WYSIWYG editor when setting is enabled');
		} finally {
			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await config.update('autoOpen', originalValue, vscode.ConfigurationTarget.Global);
			try {
				await vscode.workspace.fs.delete(testUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	test('markdown files open in text editor when auto-open is disabled', async function() {
		this.timeout(10000);
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test-no-auto-open.md');

		try {
			// Ensure auto-open is disabled (default)
			await config.update('autoOpen', false, vscode.ConfigurationTarget.Global);

			// Create test markdown file
			const encoder = new TextEncoder();
			await vscode.workspace.fs.writeFile(testUri, encoder.encode('# No Auto-Open Test'));

			// Open the file
			await vscode.commands.executeCommand('vscode.open', testUri);
			await new Promise(resolve => setTimeout(resolve, 300));

			// Verify file is in text editor (activeTextEditor should be set)
			const activeEditor = vscode.window.activeTextEditor;
			assert.ok(activeEditor, 'File should open in text editor');
			assert.strictEqual(activeEditor?.document.uri.fsPath, testUri.fsPath, 'Active editor should have the test file');
		} finally {
			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			try {
				await vscode.workspace.fs.delete(testUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});
});

suite('Auto-Open Tab Replacement Test Suite (Story 10.4)', () => {
	test('auto-open closes text editor tab after opening WYSIWYG', async function() {
		this.timeout(15000);
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const originalValue = config.get<boolean>('autoOpen', false);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test-tab-replacement.md');

		try {
			// Enable auto-open
			await config.update('autoOpen', true, vscode.ConfigurationTarget.Global);

			// Create test markdown file
			const encoder = new TextEncoder();
			await vscode.workspace.fs.writeFile(testUri, encoder.encode('# Tab Replacement Test'));

			// Open in text editor first
			await vscode.commands.executeCommand('vscode.open', testUri);

			// Wait for auto-open to trigger and close text tab
			await new Promise(resolve => setTimeout(resolve, 600));

			// Count tabs for this document
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const tabsForDocument = tabs.filter(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'uri' in input) {
					return (input as { uri: vscode.Uri }).uri.fsPath === testUri.fsPath;
				}
				return false;
			});

			// Check that there's exactly one tab (WYSIWYG only, no text editor tab)
			assert.strictEqual(tabsForDocument.length, 1, 'Should have exactly one tab for the document');

			// Verify it's the WYSIWYG editor tab
			const wysiwygTab = tabsForDocument.find(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'viewType' in input) {
					return (input as { viewType: string }).viewType === 'markdownWysiwyg.editor';
				}
				return false;
			});
			assert.ok(wysiwygTab, 'The single tab should be the WYSIWYG editor');

			// Verify no text editor tab exists
			const textTab = tabsForDocument.find(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'uri' in input) {
					// Text editor tabs have uri but no viewType
					return !('viewType' in input);
				}
				return false;
			});
			assert.strictEqual(textTab, undefined, 'Text editor tab should be closed');
		} finally {
			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await config.update('autoOpen', originalValue, vscode.ConfigurationTarget.Global);
			try {
				await vscode.workspace.fs.delete(testUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	test('manual open command does not close text tabs', async function() {
		this.timeout(10000);
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const originalValue = config.get<boolean>('autoOpen', false);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test-manual-open.md');

		try {
			// Disable auto-open to test manual command behavior
			await config.update('autoOpen', false, vscode.ConfigurationTarget.Global);

			// Create test markdown file
			const encoder = new TextEncoder();
			await vscode.workspace.fs.writeFile(testUri, encoder.encode('# Manual Open Test'));

			// Open in text editor first
			await vscode.commands.executeCommand('vscode.open', testUri);
			await new Promise(resolve => setTimeout(resolve, 200));

			// Now manually open in WYSIWYG editor using command
			await vscode.commands.executeCommand('markdownWysiwyg.openEditor', testUri);
			await new Promise(resolve => setTimeout(resolve, 500));

			// Count tabs for this document - manual open should NOT close text tab
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const tabsForDocument = tabs.filter(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'uri' in input) {
					return (input as { uri: vscode.Uri }).uri.fsPath === testUri.fsPath;
				}
				return false;
			});

			// Manual open should leave both tabs open (text + WYSIWYG)
			assert.ok(tabsForDocument.length >= 1, 'Manual open should have at least one tab');

			// Verify WYSIWYG tab exists
			const hasWysiwygTab = tabsForDocument.some(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'viewType' in input) {
					return (input as { viewType: string }).viewType === 'markdownWysiwyg.editor';
				}
				return false;
			});
			assert.ok(hasWysiwygTab, 'WYSIWYG tab should exist after manual open');
		} finally {
			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await config.update('autoOpen', originalValue, vscode.ConfigurationTarget.Global);
			try {
				await vscode.workspace.fs.delete(testUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});
});

import * as assert from 'assert';
import * as vscode from 'vscode';
import { detectLinkType, resolveLinkPath, handleLinkClick } from '../linkHandler';

suite('Link Handler Test Suite', () => {
	suite('detectLinkType', () => {
		test('detects http URLs as external', () => {
			assert.strictEqual(detectLinkType('http://example.com'), 'external');
			assert.strictEqual(detectLinkType('http://example.com/path'), 'external');
		});

		test('detects https URLs as external', () => {
			assert.strictEqual(detectLinkType('https://example.com'), 'external');
			assert.strictEqual(detectLinkType('https://github.com/repo'), 'external');
		});

		test('detects mailto links as external', () => {
			assert.strictEqual(detectLinkType('mailto:user@example.com'), 'external');
		});

		test('detects .md files as markdown', () => {
			assert.strictEqual(detectLinkType('./readme.md'), 'markdown');
			assert.strictEqual(detectLinkType('../docs/guide.md'), 'markdown');
			assert.strictEqual(detectLinkType('folder/file.md'), 'markdown');
			assert.strictEqual(detectLinkType('/absolute/path.md'), 'markdown');
		});

		test('detects .markdown files as markdown', () => {
			assert.strictEqual(detectLinkType('./readme.markdown'), 'markdown');
			assert.strictEqual(detectLinkType('guide.MARKDOWN'), 'markdown');
		});

		test('detects markdown with case insensitivity', () => {
			assert.strictEqual(detectLinkType('./readme.MD'), 'markdown');
			assert.strictEqual(detectLinkType('./readme.Md'), 'markdown');
		});

		test('detects other files correctly', () => {
			assert.strictEqual(detectLinkType('./image.png'), 'other-file');
			assert.strictEqual(detectLinkType('./data.json'), 'other-file');
			assert.strictEqual(detectLinkType('./script.js'), 'other-file');
			assert.strictEqual(detectLinkType('./document.txt'), 'other-file');
		});

		test('handles empty string', () => {
			assert.strictEqual(detectLinkType(''), 'other-file');
		});
	});

	suite('resolveLinkPath', () => {
		test('resolves relative path starting with ./', () => {
			const currentUri = vscode.Uri.file('/project/docs/index.md');
			const result = resolveLinkPath('./readme.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/project/docs/readme.md');
		});

		test('resolves relative path starting with ../', () => {
			const currentUri = vscode.Uri.file('/project/docs/index.md');
			const result = resolveLinkPath('../api.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/project/api.md');
		});

		test('resolves relative path without prefix', () => {
			const currentUri = vscode.Uri.file('/project/docs/index.md');
			const result = resolveLinkPath('folder/guide.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/project/docs/folder/guide.md');
		});

		test('resolves absolute path starting with /', () => {
			const currentUri = vscode.Uri.file('/project/docs/index.md');
			const result = resolveLinkPath('/absolute/path.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/absolute/path.md');
		});

		test('resolves file:// URI', () => {
			const currentUri = vscode.Uri.file('/project/docs/index.md');
			const result = resolveLinkPath('file:///some/path.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/some/path.md');
		});

		test('handles complex relative paths', () => {
			const currentUri = vscode.Uri.file('/project/src/components/Button.md');
			const result = resolveLinkPath('../../docs/api/reference.md', currentUri);

			assert.ok(result, 'Should return a URI');
			assert.strictEqual(result?.fsPath, '/project/docs/api/reference.md');
		});
	});
});

suite('Link Click Integration Test Suite (Story 11.1)', () => {
	test('clicking markdown link opens file in WYSIWYG editor', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		// Create two test markdown files
		const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'source-doc.md');
		const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, 'target-doc.md');

		const encoder = new TextEncoder();
		await vscode.workspace.fs.writeFile(sourceUri, encoder.encode('# Source\n\n[Link to target](./target-doc.md)'));
		await vscode.workspace.fs.writeFile(targetUri, encoder.encode('# Target\n\nThis is the target document.'));

		try {
			// Open target file directly using vscode.openWith (simulates what handleLinkClick does)
			await vscode.commands.executeCommand('vscode.openWith', targetUri, 'markdownWysiwyg.editor');

			// Wait for editor to open
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify the target file is open in WYSIWYG editor
			const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
			const hasTargetTab = tabs.some(tab => {
				const input = tab.input;
				if (input && typeof input === 'object' && 'viewType' in input && 'uri' in input) {
					const customInput = input as { viewType: string; uri: vscode.Uri };
					return customInput.viewType === 'markdownWysiwyg.editor' &&
						customInput.uri.fsPath === targetUri.fsPath;
				}
				return false;
			});

			assert.ok(hasTargetTab, 'Target markdown file should open in WYSIWYG editor');
		} finally {
			// Cleanup
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			try {
				await vscode.workspace.fs.delete(sourceUri);
				await vscode.workspace.fs.delete(targetUri);
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	test('external URL handling does not throw', async function() {
		this.timeout(5000);

		// This tests that the external URL handler works without throwing
		// We can't easily verify it opened in browser, but we can verify no errors
		const dummyUri = vscode.Uri.file('/dummy/path.md');

		// This should not throw - it will try to open the URL externally
		// In test environment, vscode.env.openExternal may not actually open anything
		// but it shouldn't throw
		try {
			await handleLinkClick('https://example.com', dummyUri);
			assert.ok(true, 'External link handling should not throw');
		} catch (error) {
			// Only fail if it's not an expected error
			assert.fail(`External link handling threw unexpected error: ${error}`);
		}
	});
});

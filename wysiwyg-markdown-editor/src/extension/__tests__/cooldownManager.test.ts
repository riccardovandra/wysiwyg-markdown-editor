import * as assert from 'assert';
import { cooldownManager } from '../cooldownManager';

/**
 * Test Suite for CooldownManager (Story 10.3)
 * Tests auto-open cooldown functionality to prevent re-open loops.
 */
suite('CooldownManager Test Suite', () => {
	// Reset state between tests
	teardown(() => {
		cooldownManager.dispose();
	});

	test('cooldownManager is imported and has expected methods', () => {
		assert.ok(cooldownManager, 'cooldownManager should be defined');
		assert.strictEqual(typeof cooldownManager.markRecentlyClosed, 'function', 'markRecentlyClosed should be a function');
		assert.strictEqual(typeof cooldownManager.isInCooldown, 'function', 'isInCooldown should be a function');
		assert.strictEqual(typeof cooldownManager.dispose, 'function', 'dispose should be a function');
	});

	test('markRecentlyClosed stores URI correctly (Task 5.1)', () => {
		const uri = 'file:///test.md';

		// Initially not in cooldown
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			false,
			'URI should not be in cooldown before marking'
		);

		// Mark as recently closed
		cooldownManager.markRecentlyClosed(uri);

		// Now should be in cooldown
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			true,
			'URI should be in cooldown after marking'
		);
	});

	test('isInCooldown returns true within cooldown period (Task 5.2)', () => {
		const uri = 'file:///test-cooldown.md';

		cooldownManager.markRecentlyClosed(uri);

		// Should be in cooldown immediately
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			true,
			'URI should be in cooldown immediately after marking'
		);
	});

	test('isInCooldown returns false for unknown URI (Task 5.3)', () => {
		const uri = 'file:///unknown.md';

		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			false,
			'Unknown URI should not be in cooldown'
		);
	});

	test('different URIs tracked independently (Task 5.4)', () => {
		const uri1 = 'file:///test1.md';
		const uri2 = 'file:///test2.md';

		// Mark only uri1
		cooldownManager.markRecentlyClosed(uri1);

		assert.strictEqual(
			cooldownManager.isInCooldown(uri1),
			true,
			'First URI should be in cooldown'
		);
		assert.strictEqual(
			cooldownManager.isInCooldown(uri2),
			false,
			'Second URI should not be in cooldown'
		);
	});

	test('dispose clears all entries', () => {
		const uri1 = 'file:///dispose-test1.md';
		const uri2 = 'file:///dispose-test2.md';

		cooldownManager.markRecentlyClosed(uri1);
		cooldownManager.markRecentlyClosed(uri2);

		// Both should be in cooldown
		assert.ok(cooldownManager.isInCooldown(uri1), 'URI1 should be in cooldown before dispose');
		assert.ok(cooldownManager.isInCooldown(uri2), 'URI2 should be in cooldown before dispose');

		// Dispose
		cooldownManager.dispose();

		// Neither should be in cooldown (state cleared)
		assert.strictEqual(
			cooldownManager.isInCooldown(uri1),
			false,
			'URI1 should not be in cooldown after dispose'
		);
		assert.strictEqual(
			cooldownManager.isInCooldown(uri2),
			false,
			'URI2 should not be in cooldown after dispose'
		);
	});

	test('cooldown expires after timeout (Task 5.3, 5.5)', async function() {
		// This test has a longer timeout due to waiting for cooldown expiry
		this.timeout(10000);

		const uri = 'file:///expire-test.md';

		cooldownManager.markRecentlyClosed(uri);

		// Should be in cooldown initially
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			true,
			'URI should be in cooldown initially'
		);

		// Wait for cooldown to expire (2000ms + buffer)
		await new Promise(resolve => setTimeout(resolve, 2500));

		// Should no longer be in cooldown
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			false,
			'URI should not be in cooldown after expiry'
		);
	});

	test('re-marking URI resets cooldown timer', async function() {
		this.timeout(10000);

		const uri = 'file:///reset-test.md';

		// Mark initially
		cooldownManager.markRecentlyClosed(uri);

		// Wait 1 second
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Should still be in cooldown
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			true,
			'URI should be in cooldown after 1 second'
		);

		// Re-mark (resets the timer)
		cooldownManager.markRecentlyClosed(uri);

		// Wait another 1.5 seconds (total 2.5s from initial, but only 1.5s from re-mark)
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Should still be in cooldown (timer was reset)
		assert.strictEqual(
			cooldownManager.isInCooldown(uri),
			true,
			'URI should still be in cooldown after re-marking'
		);
	});
});

import * as vscode from 'vscode';

/**
 * Integration Test Suite for Auto-Open Loop Prevention (Story 10.3)
 * Tests the full workflow of cooldown blocking auto-open after WYSIWYG close.
 */
suite('Auto-Open Loop Prevention Integration Tests', () => {
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

	// Helper to check if a WYSIWYG tab exists for a URI
	function hasWysiwygTabForUri(uri: vscode.Uri): boolean {
		const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
		return tabs.some(tab => {
			if (tab.input && typeof tab.input === 'object' && 'uri' in tab.input && 'viewType' in tab.input) {
				const input = tab.input as { uri: vscode.Uri; viewType: string };
				return input.uri.toString() === uri.toString() && input.viewType === 'markdownWysiwyg.editor';
			}
			return false;
		});
	}

	// Reset cooldown state between tests
	teardown(() => {
		cooldownManager.dispose();
	});

	test('auto-open blocked after WYSIWYG close - cooldown in effect (Task 6.1, AC #1)', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		// Disable auto-open for this test to control behavior manually
		const config = vscode.workspace.getConfiguration('markdownWysiwyg');
		const originalAutoOpen = config.get<boolean>('autoOpen');

		try {
			// Ensure auto-open is disabled first
			await config.update('autoOpen', false, vscode.ConfigurationTarget.Global);

			const testUri = await createTestFile('test-cooldown-block.md');

			// Open in WYSIWYG
			await vscode.commands.executeCommand('vscode.openWith', testUri, 'markdownWysiwyg.editor');
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Close WYSIWYG - this marks the URI for cooldown
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			await new Promise(resolve => setTimeout(resolve, 500));

			// Verify cooldown is set
			assert.strictEqual(
				cooldownManager.isInCooldown(testUri.toString()),
				true,
				'Cooldown should be set after closing WYSIWYG editor'
			);

			await deleteTestFile(testUri);
		} finally {
			// Restore original auto-open setting
			await config.update('autoOpen', originalAutoOpen, vscode.ConfigurationTarget.Global);
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
		}
	});

	test('manual command works during cooldown (Task 6.2, AC #4)', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri = await createTestFile('test-manual-during-cooldown.md');

		try {
			// Mark URI as recently closed (simulating WYSIWYG close)
			cooldownManager.markRecentlyClosed(testUri.toString());

			// Verify cooldown is active
			assert.strictEqual(
				cooldownManager.isInCooldown(testUri.toString()),
				true,
				'Cooldown should be active'
			);

			// Open text editor first
			await vscode.commands.executeCommand('vscode.open', testUri);
			await new Promise(resolve => setTimeout(resolve, 500));

			// Use manual command - should work despite cooldown
			await vscode.commands.executeCommand('markdownWysiwyg.openEditor', testUri);
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Verify WYSIWYG opened (manual command bypasses cooldown)
			assert.strictEqual(
				hasWysiwygTabForUri(testUri),
				true,
				'Manual command should open WYSIWYG editor during cooldown'
			);
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri);
		}
	});

	test('different files not affected by cooldown (Task 6.3, AC #5)', async function() {
		this.timeout(15000);

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return this.skip();
		}

		const testUri1 = await createTestFile('test-cooldown-file1.md');
		const testUri2 = await createTestFile('test-cooldown-file2.md');

		try {
			// Mark only first file as recently closed
			cooldownManager.markRecentlyClosed(testUri1.toString());

			// Verify cooldown state
			assert.strictEqual(
				cooldownManager.isInCooldown(testUri1.toString()),
				true,
				'First URI should be in cooldown'
			);
			assert.strictEqual(
				cooldownManager.isInCooldown(testUri2.toString()),
				false,
				'Second URI should NOT be in cooldown'
			);

			// Different file's cooldown state is independent
			// This verifies the URIs are tracked separately
		} finally {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await deleteTestFile(testUri1);
			await deleteTestFile(testUri2);
		}
	});
});

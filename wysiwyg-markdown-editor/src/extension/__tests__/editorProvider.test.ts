import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	MarkdownEditorProvider,
	buildContentSecurityPolicy,
	computeLocalResourceRoots,
} from '../editorProvider';
import { VIEW_TYPE, EXTENSION_NAME } from '../../shared/constants';

suite('MarkdownEditorProvider Test Suite', () => {
	test('viewType matches constant', () => {
		assert.strictEqual(MarkdownEditorProvider.viewType, VIEW_TYPE);
		assert.strictEqual(MarkdownEditorProvider.viewType, 'markdownWysiwyg.editor');
	});

	test('provider class exists and is constructable', () => {
		assert.ok(MarkdownEditorProvider);
		assert.strictEqual(typeof MarkdownEditorProvider, 'function');
	});

	test('provider has resolveCustomTextEditor method', () => {
		assert.ok(MarkdownEditorProvider.prototype.resolveCustomTextEditor);
		assert.strictEqual(typeof MarkdownEditorProvider.prototype.resolveCustomTextEditor, 'function');
	});

	test('viewType follows naming convention', () => {
		// ViewType should be in format: namespace.identifier
		assert.ok(MarkdownEditorProvider.viewType.includes('.'), 'viewType should contain a dot separator');
		assert.ok(MarkdownEditorProvider.viewType.startsWith('markdown'), 'viewType should start with markdown');
	});

	test('constants are properly defined', () => {
		assert.strictEqual(VIEW_TYPE, 'markdownWysiwyg.editor');
		assert.strictEqual(EXTENSION_NAME, 'Markdown WYSIWYG');
	});
});

suite('Story 13.1: CSP allows images', () => {
	test('CSP includes img-src with cspSource, https:, and data:', () => {
		const csp = buildContentSecurityPolicy('vscode-webview://abc', 'nonce123');
		assert.ok(csp.includes('img-src'), 'CSP should include img-src directive');
		assert.ok(csp.includes('vscode-webview://abc'), 'CSP img-src should include cspSource');
		assert.ok(csp.includes('https:'), 'CSP img-src should allow https:');
		assert.ok(csp.includes('data:'), 'CSP img-src should allow data: URIs');
	});

	test('CSP keeps default-src none baseline', () => {
		const csp = buildContentSecurityPolicy('vscode-webview://abc', 'nonce123');
		assert.ok(csp.includes("default-src 'none'"), 'CSP must keep default-src none');
	});

	test('CSP does NOT loosen img-src to http: or unsafe-inline', () => {
		const csp = buildContentSecurityPolicy('vscode-webview://abc', 'nonce123');
		// `http:` MUST NOT appear as a standalone scheme allowance
		assert.ok(
			!/img-src[^;]*\bhttp:(?!\/\/)/.test(csp),
			'CSP img-src must not allow plain http:'
		);
		// img-src must not include unsafe-inline
		const imgSrcMatch = csp.match(/img-src([^;]*)/);
		assert.ok(imgSrcMatch, 'img-src directive should be present');
		assert.ok(
			!imgSrcMatch![1].includes("'unsafe-inline'"),
			'img-src must not include unsafe-inline'
		);
	});

	test('CSP keeps script-src nonce-locked', () => {
		const csp = buildContentSecurityPolicy('vscode-webview://abc', 'mynonce');
		assert.ok(csp.includes("'nonce-mynonce'"), 'script-src must keep its nonce');
		assert.ok(csp.includes("'strict-dynamic'"), 'script-src must keep strict-dynamic');
	});
});

suite('Story 13.1: localResourceRoots includes document context', () => {
	const extensionUri = vscode.Uri.file('/ext');
	const documentUri = vscode.Uri.file('/workspace/docs/guide.md');
	const documentDir = vscode.Uri.joinPath(documentUri, '..');

	test('roots include extension dist/webview directory', () => {
		const roots = computeLocalResourceRoots(extensionUri, documentUri, undefined);
		const expected = vscode.Uri.joinPath(extensionUri, 'dist', 'webview');
		assert.ok(
			roots.some(uri => uri.toString() === expected.toString()),
			'Should include extension dist/webview path'
		);
	});

	test('roots include document parent directory', () => {
		const roots = computeLocalResourceRoots(extensionUri, documentUri, undefined);
		assert.ok(
			roots.some(uri => uri.toString() === documentDir.toString()),
			'Should include document parent directory'
		);
	});

	test('roots include workspace folder when present', () => {
		const workspaceFolder: vscode.WorkspaceFolder = {
			uri: vscode.Uri.file('/workspace'),
			name: 'workspace',
			index: 0,
		};
		const roots = computeLocalResourceRoots(extensionUri, documentUri, workspaceFolder);
		assert.ok(
			roots.some(uri => uri.toString() === workspaceFolder.uri.toString()),
			'Should include workspace folder when provided'
		);
	});

	test('roots omit workspace folder when document is outside any workspace', () => {
		const roots = computeLocalResourceRoots(extensionUri, documentUri, undefined);
		// Should be exactly two: extension dist + document dir
		assert.strictEqual(roots.length, 2, 'Should have exactly 2 roots when no workspace');
	});
});

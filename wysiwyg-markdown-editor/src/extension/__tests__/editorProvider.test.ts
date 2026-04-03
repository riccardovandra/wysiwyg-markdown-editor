import * as assert from 'assert';
import { MarkdownEditorProvider } from '../editorProvider';
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

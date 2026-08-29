import * as vscode from 'vscode';
import { removedComments } from '../shared/criticMarkup';
import type { CriticComment } from '../shared/criticMarkup';
import { outputChannel } from './outputChannel';

export type HistorySource = 'editor' | 'external';

/**
 * History file for a document: `docs/spec.md` -> `docs/spec.comments.md`.
 */
export function historyUriFor(documentUri: vscode.Uri): vscode.Uri {
	const base = documentUri.path.replace(/\.md$/i, '');
	return documentUri.with({ path: `${base}.comments.md` });
}

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

export function formatTimestamp(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * One history entry per resolved comment. Notes are listed in thread order so
 * the record shows both the request and any agent reply.
 */
export function formatHistoryEntry(comment: CriticComment, source: HistorySource, when: Date): string {
	const label = source === 'editor' ? 'resolved in editor' : 'removed outside the editor (agent or text edit)';
	const lines = [`## ${formatTimestamp(when)} · ${label}`, ''];
	if (comment.anchor) {
		lines.push(...comment.anchor.split('\n').map((l) => `> ${l}`), '');
	}
	lines.push(...comment.notes.map((n) => `- ${n}`), '');
	return lines.join('\n');
}

function historyHeader(documentUri: vscode.Uri): string {
	const name = documentUri.path.split('/').pop() ?? documentUri.path;
	return `# Comment history for ${name}\n\nResolved comments, oldest first. Written automatically by Markdown WYSIWYG; safe to delete.\n\n`;
}

/**
 * Appends resolved comments to the document's history file, creating it on first use.
 */
export async function appendCommentHistory(
	documentUri: vscode.Uri,
	comments: CriticComment[],
	source: HistorySource,
	when: Date = new Date()
): Promise<void> {
	if (comments.length === 0) {
		return;
	}
	const target = historyUriFor(documentUri);
	let existing = '';
	try {
		existing = Buffer.from(await vscode.workspace.fs.readFile(target)).toString('utf8');
	} catch {
		existing = historyHeader(documentUri);
	}
	const entries = comments.map((c) => formatHistoryEntry(c, source, when)).join('\n');
	const separator = existing.endsWith('\n\n') || existing.length === 0 ? '' : '\n';
	await vscode.workspace.fs.writeFile(target, Buffer.from(existing + separator + entries, 'utf8'));
	outputChannel.log(`Logged ${comments.length} resolved comment(s) to ${target.fsPath}`);
}

/**
 * Diffs two versions of a document and logs any comment that disappeared.
 * Never throws: history is a convenience and must not block editing.
 */
export async function logRemovedComments(
	documentUri: vscode.Uri,
	before: string,
	after: string,
	source: HistorySource
): Promise<void> {
	const enabled = vscode.workspace.getConfiguration('markdownWysiwyg').get<boolean>('commentHistory', true);
	if (!enabled || before === after) {
		return;
	}
	try {
		await appendCommentHistory(documentUri, removedComments(before, after), source);
	} catch (error) {
		outputChannel.log(`Failed to write comment history: ${error}`);
	}
}

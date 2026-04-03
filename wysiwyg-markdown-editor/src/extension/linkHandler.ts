import * as vscode from 'vscode';
import * as path from 'path';
import { VIEW_TYPE } from '../shared/constants';
import { outputChannel } from './outputChannel';

/**
 * Types of links that can be clicked in the editor
 */
export type LinkType = 'external' | 'markdown' | 'other-file';

/**
 * Detects the type of a link based on its href.
 *
 * @param href - The href attribute from the clicked link
 * @returns The type of link
 */
export function detectLinkType(href: string): LinkType {
	// External URLs (http, https, ftp use ://, while mailto and tel use just :)
	if (/^(https?|ftp):\/\//i.test(href) || /^(mailto|tel):/i.test(href)) {
		return 'external';
	}

	// Check if it's a markdown file (relative or absolute path)
	const lowerHref = href.toLowerCase();
	if (lowerHref.endsWith('.md') || lowerHref.endsWith('.markdown')) {
		return 'markdown';
	}

	// All other files
	return 'other-file';
}

/**
 * Resolves a relative path to an absolute file URI.
 *
 * @param href - The href from the link (relative or absolute)
 * @param currentDocumentUri - The URI of the document containing the link
 * @returns The resolved vscode.Uri, or null if resolution fails
 */
export function resolveLinkPath(href: string, currentDocumentUri: vscode.Uri): vscode.Uri | null {
	try {
		// Handle file:// URIs directly
		if (href.startsWith('file://')) {
			return vscode.Uri.parse(href);
		}

		// Handle absolute paths (starting with /)
		if (href.startsWith('/')) {
			return vscode.Uri.file(href);
		}

		// Get the directory of the current document
		const currentDir = path.dirname(currentDocumentUri.fsPath);

		// Resolve relative path
		const resolvedPath = path.resolve(currentDir, href);

		return vscode.Uri.file(resolvedPath);
	} catch (error) {
		outputChannel.log(`Failed to resolve link path: ${href}, error: ${error}`);
		return null;
	}
}

/**
 * Handles a link click from the WebView.
 * Routes to appropriate handler based on link type.
 *
 * @param href - The href attribute from the clicked link
 * @param currentDocumentUri - The URI of the document containing the link
 */
export async function handleLinkClick(
	href: string,
	currentDocumentUri: vscode.Uri
): Promise<void> {
	outputChannel.log(`Link clicked: ${href}`);

	const linkType = detectLinkType(href);
	outputChannel.log(`Link type detected: ${linkType}`);

	switch (linkType) {
		case 'external':
			await handleExternalLink(href);
			break;

		case 'markdown':
			await handleMarkdownLink(href, currentDocumentUri);
			break;

		case 'other-file':
			await handleOtherFileLink(href, currentDocumentUri);
			break;
	}
}

/**
 * Opens an external URL in the system's default browser.
 */
async function handleExternalLink(href: string): Promise<void> {
	try {
		const uri = vscode.Uri.parse(href);
		await vscode.env.openExternal(uri);
		outputChannel.log(`Opened external URL: ${href}`);
	} catch (error) {
		outputChannel.log(`Failed to open external URL: ${href}, error: ${error}`);
		vscode.window.showErrorMessage(`Failed to open link: ${href}`);
	}
}

/**
 * Opens a markdown file in the WYSIWYG editor.
 * This is explicit user intent, so it should work regardless of auto-open setting.
 */
async function handleMarkdownLink(
	href: string,
	currentDocumentUri: vscode.Uri
): Promise<void> {
	const resolvedUri = resolveLinkPath(href, currentDocumentUri);

	if (!resolvedUri) {
		vscode.window.showErrorMessage(`Could not resolve path: ${href}`);
		return;
	}

	try {
		// Check if file exists
		await vscode.workspace.fs.stat(resolvedUri);

		// Open in WYSIWYG editor (explicit user intent - ignores auto-open setting)
		await vscode.commands.executeCommand(
			'vscode.openWith',
			resolvedUri,
			VIEW_TYPE
		);
		outputChannel.log(`Opened markdown file in WYSIWYG: ${resolvedUri.fsPath}`);
	} catch (error) {
		// File not found or other error - let VS Code handle it
		if ((error as NodeJS.ErrnoException).code === 'FileNotFound' ||
			(error as vscode.FileSystemError).code === 'FileNotFound') {
			outputChannel.log(`File not found: ${resolvedUri.fsPath}`);
			vscode.window.showErrorMessage(`File not found: ${href}`);
		} else {
			outputChannel.log(`Error opening markdown file: ${error}`);
			vscode.window.showErrorMessage(`Could not open file: ${href}`);
		}
	}
}

/**
 * Opens a non-markdown file in VS Code's default editor for that file type.
 */
async function handleOtherFileLink(
	href: string,
	currentDocumentUri: vscode.Uri
): Promise<void> {
	const resolvedUri = resolveLinkPath(href, currentDocumentUri);

	if (!resolvedUri) {
		vscode.window.showErrorMessage(`Could not resolve path: ${href}`);
		return;
	}

	try {
		// Check if file exists
		await vscode.workspace.fs.stat(resolvedUri);

		// Open with default editor
		await vscode.commands.executeCommand('vscode.open', resolvedUri);
		outputChannel.log(`Opened file with default editor: ${resolvedUri.fsPath}`);
	} catch (error) {
		// File not found or other error
		if ((error as NodeJS.ErrnoException).code === 'FileNotFound' ||
			(error as vscode.FileSystemError).code === 'FileNotFound') {
			outputChannel.log(`File not found: ${resolvedUri.fsPath}`);
			vscode.window.showErrorMessage(`File not found: ${href}`);
		} else {
			outputChannel.log(`Error opening file: ${error}`);
			vscode.window.showErrorMessage(`Could not open file: ${href}`);
		}
	}
}

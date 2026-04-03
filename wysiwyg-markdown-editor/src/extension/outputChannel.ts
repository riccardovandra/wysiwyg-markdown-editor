import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../shared/constants';

/**
 * Singleton OutputChannel for extension logging.
 * Use this for debug output visible in VS Code's Output panel.
 */
class OutputChannelManager {
	private static instance: vscode.OutputChannel | undefined;

	/**
	 * Gets or creates the output channel for this extension.
	 */
	public static getChannel(): vscode.OutputChannel {
		if (!OutputChannelManager.instance) {
			OutputChannelManager.instance = vscode.window.createOutputChannel(EXTENSION_NAME);
		}
		return OutputChannelManager.instance;
	}

	/**
	 * Logs a message to the output channel.
	 */
	public static log(message: string): void {
		const channel = OutputChannelManager.getChannel();
		const timestamp = new Date().toISOString();
		channel.appendLine(`[${timestamp}] ${message}`);
	}

	/**
	 * Logs an error to the output channel.
	 */
	public static error(message: string, error?: Error): void {
		const channel = OutputChannelManager.getChannel();
		const timestamp = new Date().toISOString();
		channel.appendLine(`[${timestamp}] ERROR: ${message}`);
		if (error) {
			channel.appendLine(`  ${error.message}`);
			if (error.stack) {
				channel.appendLine(`  ${error.stack}`);
			}
		}
	}

	/**
	 * Disposes the output channel.
	 */
	public static dispose(): void {
		if (OutputChannelManager.instance) {
			OutputChannelManager.instance.dispose();
			OutputChannelManager.instance = undefined;
		}
	}
}

export const outputChannel = OutputChannelManager;

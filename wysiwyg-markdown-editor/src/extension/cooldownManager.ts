import { outputChannel } from './outputChannel';

const COOLDOWN_MS = 2000; // 2 seconds cooldown period

/**
 * Manages auto-open cooldown for recently closed WYSIWYG editors.
 * When a WYSIWYG editor is closed, auto-open is suppressed for that document
 * for COOLDOWN_MS to prevent frustrating re-open loops.
 */
class CooldownManager {
	private recentlyClosed = new Map<string, number>(); // URI → close timestamp
	private cleanupTimers = new Map<string, NodeJS.Timeout>(); // URI → cleanup timer

	/**
	 * Mark a document URI as recently closed from WYSIWYG editor.
	 * Auto-open will be suppressed for this URI for COOLDOWN_MS.
	 */
	markRecentlyClosed(uri: string): void {
		// Clear any existing timer for this URI
		const existingTimer = this.cleanupTimers.get(uri);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		// Store the close timestamp
		this.recentlyClosed.set(uri, Date.now());
		outputChannel.log(`CooldownManager: Marked ${uri} as recently closed`);

		// Schedule cleanup
		const timer = setTimeout(() => {
			this.recentlyClosed.delete(uri);
			this.cleanupTimers.delete(uri);
			outputChannel.log(`CooldownManager: Cooldown expired for ${uri}`);
		}, COOLDOWN_MS);

		this.cleanupTimers.set(uri, timer);
	}

	/**
	 * Check if a document URI is in cooldown period.
	 * Returns true if auto-open should be suppressed.
	 */
	isInCooldown(uri: string): boolean {
		const closeTime = this.recentlyClosed.get(uri);
		if (!closeTime) {
			return false;
		}

		const elapsed = Date.now() - closeTime;
		const inCooldown = elapsed < COOLDOWN_MS;

		if (inCooldown) {
			outputChannel.log(`CooldownManager: ${uri} in cooldown (${elapsed}ms elapsed)`);
		}

		return inCooldown;
	}

	/**
	 * Dispose all timers (for extension deactivation).
	 */
	dispose(): void {
		for (const timer of this.cleanupTimers.values()) {
			clearTimeout(timer);
		}
		this.cleanupTimers.clear();
		this.recentlyClosed.clear();
	}
}

export const cooldownManager = new CooldownManager();

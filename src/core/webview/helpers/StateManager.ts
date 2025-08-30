/**
 * StateManager - THE future state management system for ClineProvider
 *
 * VISION: This will eventually handle ALL state operations:
 * - Global state management
 * - Task history management
 * - Settings persistence
 * - State validation and transformation
 * - Cache management
 * - State synchronization
 *
 * BABY STEP 1: Start with basic state operations, expand over time
 */

import { GlobalState, HistoryItem } from "@roo-code/types"
import { ContextProxy } from "../../config/ContextProxy"

export class StateManager {
	private recentTasksCache?: string[]

	constructor(
		private readonly contextProxy: ContextProxy,
		private readonly workspacePath: string,
	) {}

	/**
	 * Core state operations - these will become the foundation
	 */
	async updateGlobalState<K extends keyof GlobalState>(key: K, value: GlobalState[K]): Promise<void> {
		await this.contextProxy.setValue(key, value)

		// Intelligent cache invalidation
		if (key === "taskHistory") {
			this.invalidateTaskCache()
		}
	}

	getGlobalState<K extends keyof GlobalState>(key: K): GlobalState[K] {
		return this.contextProxy.getValue(key)
	}

	/**
	 * Task History Management - this will grow into full task state management
	 */
	getTaskHistory(): HistoryItem[] {
		return this.getGlobalState("taskHistory") ?? []
	}

	async updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]> {
		const history = this.getTaskHistory()
		const existingItemIndex = history.findIndex((h) => h.id === item.id)

		if (existingItemIndex !== -1) {
			history[existingItemIndex] = item
		} else {
			history.push(item)
		}

		await this.updateGlobalState("taskHistory", history)
		return history
	}

	/**
	 * Cache Management - foundation for performance optimizations
	 */
	private invalidateTaskCache(): void {
		this.recentTasksCache = undefined
	}

	getRecentTasks(): string[] {
		if (this.recentTasksCache) {
			return this.recentTasksCache
		}

		const history = this.getTaskHistory()
		const workspaceTasks = history.filter((item) => item.ts && item.task && item.workspace === this.workspacePath)

		if (workspaceTasks.length === 0) {
			this.recentTasksCache = []
			return this.recentTasksCache
		}

		workspaceTasks.sort((a, b) => b.ts - a.ts)

		// Smart caching logic
		if (workspaceTasks.length >= 100) {
			const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
			this.recentTasksCache = workspaceTasks.filter((item) => item.ts >= sevenDaysAgo).map((item) => item.id)
		} else {
			this.recentTasksCache = workspaceTasks.slice(0, Math.min(100, workspaceTasks.length)).map((item) => item.id)
		}

		return this.recentTasksCache
	}

	/**
	 * Next expansion areas:
	 * - getApplicationState() - full app state composition
	 * - validateState() - state integrity checks
	 * - syncWithCloud() - cloud state synchronization
	 * - migrateState() - version migrations
	 * - exportState() - backup/export functionality
	 * - resetState() - clean slate operations
	 */
}

/**
 * TaskManager - THE task lifecycle management system for ClineProvider
 *
 * VISION: This will handle ALL task operations:
 * - Task creation and initialization
 * - Task stack management (LIFO)
 * - Task lifecycle events
 * - Task state transitions
 * - Task cleanup and disposal
 * - Subtask orchestration
 *
 * BABY STEP 2: Start with core task stack operations, expand over time
 */

import { RooCodeEventName } from "@roo-code/types"
import * as vscode from "vscode"
import { Task } from "../../task/Task"

export class TaskManager {
	private taskStack: Task[] = []

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly outputChannel: vscode.OutputChannel,
		private readonly taskCreationCallback: (task: Task) => void,
	) {}

	/**
	 * Core Task Stack Operations
	 */
	public getCurrentTask(): Task | undefined {
		if (this.taskStack.length === 0) {
			return undefined
		}
		return this.taskStack[this.taskStack.length - 1]
	}

	public getTaskStackSize(): number {
		return this.taskStack.length
	}

	public getCurrentTaskStack(): string[] {
		return this.taskStack.map((task) => task.taskId)
	}

	/**
	 * Task Stack Management - LIFO operations
	 */
	public async addTaskToStack(task: Task): Promise<void> {
		this.taskStack.push(task)
		task.emit(RooCodeEventName.TaskFocused)
		this.log(`[TaskManager] Task ${task.taskId}.${task.instanceId} added to stack`)
	}

	public async removeTaskFromStack(): Promise<void> {
		if (this.taskStack.length === 0) {
			return
		}

		const task = this.taskStack.pop()
		if (!task) return

		task.emit(RooCodeEventName.TaskUnfocused)

		try {
			await task.abortTask(true)
		} catch (error) {
			this.log(`[TaskManager] Failed to abort task ${task.taskId}.${task.instanceId}: ${error}`)
		}

		this.log(`[TaskManager] Task ${task.taskId}.${task.instanceId} removed from stack`)
	}



	/**
	 * Task Lifecycle Operations
	 */
	public async clearCurrentTask(): Promise<void> {
		if (this.taskStack.length > 0) {
			const task = this.taskStack[this.taskStack.length - 1]
			this.log(`[TaskManager] Clearing task ${task.taskId}.${task.instanceId}`)
			await this.removeTaskFromStack()
		}
	}

	public async clearAllTasks(): Promise<void> {
		while (this.taskStack.length > 0) {
			await this.removeTaskFromStack()
		}
		this.log(`[TaskManager] All tasks cleared`)
	}

	/**
	 * Task Utilities
	 */
	public findTaskById(taskId: string): Task | undefined {
		return this.taskStack.find((task) => task.taskId === taskId)
	}

	public isTaskActive(taskId: string): boolean {
		const currentTask = this.getCurrentTask()
		return currentTask ? currentTask.taskId === taskId : false
	}

	public getAllTasks(): Task[] {
		return [...this.taskStack]
	}

	public getRootTask(): Task | undefined {
		return this.taskStack.length > 0 ? this.taskStack[0] : undefined
	}

	/**
	 * Logging helper
	 */
	private log(message: string): void {
		this.outputChannel.appendLine(message)
		console.log(message)
	}

	/**
	 * Next expansion areas:
	 * - createTask() - full task creation with configuration
	 * - cancelTask() - graceful task cancellation
	 * - resumeTask() - task resumption logic
	 * - finishSubTask() - subtask completion handling
	 * - performPreparationTasks() - task setup operations
	 * - Task state validation and transitions
	 * - Task metrics and analytics
	 */
}

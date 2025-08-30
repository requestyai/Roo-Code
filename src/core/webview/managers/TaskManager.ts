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
import { Task } from "../task/Task"

export class TaskManager {
	private taskStack: Task[] = []
	private taskEventListeners: WeakMap<Task, Array<() => void>> = new WeakMap()

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

		// Clean up event listeners
		const cleanupFunctions = this.taskEventListeners.get(task)
		if (cleanupFunctions) {
			cleanupFunctions.forEach((cleanup) => cleanup())
			this.taskEventListeners.delete(task)
		}

		this.log(`[TaskManager] Task ${task.taskId}.${task.instanceId} removed from stack`)
	}

	/**
	 * Task Event Management
	 */
	public attachTaskEventListeners(task: Task): void {
		const onTaskStarted = () => task.emit(RooCodeEventName.TaskStarted, task.taskId)
		const onTaskCompleted = (taskId: string, tokenUsage: any, toolUsage: any) =>
			task.emit(RooCodeEventName.TaskCompleted, taskId, tokenUsage, toolUsage)
		const onTaskAborted = () => task.emit(RooCodeEventName.TaskAborted, task.taskId)
		const onTaskFocused = () => task.emit(RooCodeEventName.TaskFocused, task.taskId)
		const onTaskUnfocused = () => task.emit(RooCodeEventName.TaskUnfocused, task.taskId)
		const onTaskActive = (taskId: string) => task.emit(RooCodeEventName.TaskActive, taskId)
		const onTaskInteractive = (taskId: string) => task.emit(RooCodeEventName.TaskInteractive, taskId)
		const onTaskResumable = (taskId: string) => task.emit(RooCodeEventName.TaskResumable, taskId)
		const onTaskIdle = (taskId: string) => task.emit(RooCodeEventName.TaskIdle, taskId)

		// Attach listeners
		task.on(RooCodeEventName.TaskStarted, onTaskStarted)
		task.on(RooCodeEventName.TaskCompleted, onTaskCompleted)
		task.on(RooCodeEventName.TaskAborted, onTaskAborted)
		task.on(RooCodeEventName.TaskFocused, onTaskFocused)
		task.on(RooCodeEventName.TaskUnfocused, onTaskUnfocused)
		task.on(RooCodeEventName.TaskActive, onTaskActive)
		task.on(RooCodeEventName.TaskInteractive, onTaskInteractive)
		task.on(RooCodeEventName.TaskResumable, onTaskResumable)
		task.on(RooCodeEventName.TaskIdle, onTaskIdle)

		// Store cleanup functions
		this.taskEventListeners.set(task, [
			() => task.off(RooCodeEventName.TaskStarted, onTaskStarted),
			() => task.off(RooCodeEventName.TaskCompleted, onTaskCompleted),
			() => task.off(RooCodeEventName.TaskAborted, onTaskAborted),
			() => task.off(RooCodeEventName.TaskFocused, onTaskFocused),
			() => task.off(RooCodeEventName.TaskUnfocused, onTaskUnfocused),
			() => task.off(RooCodeEventName.TaskActive, onTaskActive),
			() => task.off(RooCodeEventName.TaskInteractive, onTaskInteractive),
			() => task.off(RooCodeEventName.TaskResumable, onTaskResumable),
			() => task.off(RooCodeEventName.TaskIdle, onTaskIdle),
		])
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

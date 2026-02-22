import { Router } from 'express';
import { getDatabase } from '../database';
import { TodoList, TodoTask, AgentTaskRun, TaskStatus, TaskPriority } from '../types';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router: Router = Router();
const db = getDatabase();

// =====================
// TodoList Routes
// =====================

// List todo lists for a project
router.get('/projects/:projectId/todo-lists', (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const todoLists = db.getTodoListsByProject(projectId);
    
    // Add task counts to each list
    const listsWithCounts = todoLists.map(list => {
      const tasks = db.getTodoTasksByList(list.id);
      return {
        ...list,
        task_count: tasks.length,
        completed_count: tasks.filter(t => t.status === 'completed').length,
        in_progress_count: tasks.filter(t => t.status === 'in_progress').length,
      };
    });

    res.json(listsWithCounts);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create todo list for a project
router.post('/projects/:projectId/todo-lists', (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const todoList = db.addTodoList(projectId, name.trim(), description || null);
    res.status(201).json(todoList);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get todo list by ID
router.get('/todo-lists/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo list ID' });
    }

    const todoList = db.getTodoList(id);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    res.json(todoList);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update todo list
router.put('/todo-lists/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo list ID' });
    }

    const { name, description } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    const todoList = db.updateTodoList(id, updates);
    res.json(todoList);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete todo list
router.delete('/todo-lists/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid todo list ID' });
    }

    db.removeTodoList(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// =====================
// TodoTask Routes
// =====================

// List tasks for a todo list
router.get('/todo-lists/:listId/tasks', (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (isNaN(listId)) {
      return res.status(400).json({ error: 'Invalid todo list ID' });
    }

    // Verify list exists
    const todoList = db.getTodoList(listId);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const tasks = db.getTodoTasksByList(listId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all tasks for a project (across all lists)
router.get('/projects/:projectId/tasks', (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Verify project exists
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const tasks = db.getTodoTasksByProject(projectId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Create task in a todo list
router.post('/todo-lists/:listId/tasks', (req, res) => {
  try {
    const listId = parseInt(req.params.listId, 10);
    if (isNaN(listId)) {
      return res.status(400).json({ error: 'Invalid todo list ID' });
    }

    // Verify list exists
    const todoList = db.getTodoList(listId);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const { title, description, priority } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Validate priority if provided
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    }

    const task = db.addTodoTask(listId, title.trim(), description || null, priority || 'medium');
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get task by ID
router.get('/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update task
router.put('/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { title, description, status, priority, order, assignee_agent_id, worktree_path, worktree_branch } = req.body;

    // Validate status if provided
    const validStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'blocked'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Validate priority if provided
    const validPriorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (order !== undefined) updates.order = order;
    if (assignee_agent_id !== undefined) updates.assignee_agent_id = assignee_agent_id;
    if (worktree_path !== undefined) updates.worktree_path = worktree_path;
    if (worktree_branch !== undefined) updates.worktree_branch = worktree_branch;

    const task = db.updateTodoTask(id, updates);
    res.json(task);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete task
router.delete('/tasks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    db.removeTodoTask(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Toggle task status (convenience endpoint)
router.post('/tasks/:id/toggle', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Cycle through statuses: pending -> in_progress -> completed -> pending
    const statusCycle: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    const updatedTask = db.updateTodoTask(id, { status: nextStatus });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// =====================
// Agent Task Assignment Routes
// =====================

// Assign agent to task
router.post('/tasks/:id/assign-agent', (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { agent_id } = req.body;

    if (agent_id === null || agent_id === undefined) {
      // Unassign agent
      const updatedTask = db.updateTodoTask(taskId, { assignee_agent_id: null });
      return res.json(updatedTask);
    }

    const agentId = parseInt(agent_id, 10);
    if (isNaN(agentId)) {
      return res.status(400).json({ error: 'Invalid agent ID' });
    }

    // Verify agent exists
    const agent = db.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Verify agent belongs to the same project as the task
    const todoList = db.getTodoList(task.list_id);
    if (!todoList || todoList.project_id !== agent.project_id) {
      return res.status(400).json({ error: 'Agent must belong to the same project as the task' });
    }

    const updatedTask = db.updateTodoTask(taskId, { assignee_agent_id: agentId });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start agent on task (creates worktree and launches agent)
router.post('/tasks/:id/start', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.assignee_agent_id) {
      return res.status(400).json({ error: 'No agent assigned to this task' });
    }

    if (task.status === 'in_progress') {
      return res.status(400).json({ error: 'Task is already in progress' });
    }

    const agent = db.getAgent(task.assignee_agent_id);
    if (!agent) {
      return res.status(404).json({ error: 'Assigned agent not found' });
    }

    const todoList = db.getTodoList(task.list_id);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const project = db.getProject(todoList.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create worktree for the task
    const worktreeDir = path.join(project.path, '.worktrees');
    const taskSlug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const branchName = `task/${task.id}-${taskSlug}`;
    const worktreePath = path.join(worktreeDir, `task-${task.id}`);

    // Ensure worktrees directory exists
    if (!fs.existsSync(worktreeDir)) {
      fs.mkdirSync(worktreeDir, { recursive: true });
    }

    // Create the worktree
    try {
      await execAsync(`git worktree add -b ${branchName} ${worktreePath}`, { cwd: project.path });
    } catch (error: any) {
      // If branch already exists, try without creating new branch
      if (error.message.includes('already exists')) {
        await execAsync(`git worktree add ${worktreePath} ${branchName}`, { cwd: project.path });
      } else {
        throw error;
      }
    }

    // Update task with worktree info and status
    const updatedTask = db.updateTodoTask(taskId, {
      status: 'in_progress',
      worktree_path: worktreePath,
      worktree_branch: branchName,
    });

    // Create agent task run record
    const run = db.addAgentTaskRun(agent.id, taskId, worktreePath, branchName);

    res.status(201).json({
      task: updatedTask,
      run,
      worktree: {
        path: worktreePath,
        branch: branchName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Merge task worktree back to main
router.post('/tasks/:id/merge', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.worktree_path || !task.worktree_branch) {
      return res.status(400).json({ error: 'No worktree associated with this task' });
    }

    const todoList = db.getTodoList(task.list_id);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const project = db.getProject(todoList.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get current branch to switch back to
    const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: project.path });
    const mainBranch = currentBranch.trim() === task.worktree_branch ? 'main' : currentBranch.trim();

    // Commit any changes in the worktree
    try {
      await execAsync('git add -A', { cwd: task.worktree_path });
      await execAsync(`git commit -m "Complete task: ${task.title}"`, { cwd: task.worktree_path });
    } catch {
      // No changes to commit, continue
    }

    // Switch to main branch and merge
    await execAsync(`git checkout ${mainBranch}`, { cwd: project.path });
    await execAsync(`git merge ${task.worktree_branch}`, { cwd: project.path });

    // Remove worktree
    await execAsync(`git worktree remove ${task.worktree_path}`, { cwd: project.path });
    
    // Delete the branch
    try {
      await execAsync(`git branch -d ${task.worktree_branch}`, { cwd: project.path });
    } catch {
      // Branch might have unmerged changes, force delete
      await execAsync(`git branch -D ${task.worktree_branch}`, { cwd: project.path });
    }

    // Update task status
    const updatedTask = db.updateTodoTask(taskId, {
      status: 'completed',
      worktree_path: null,
      worktree_branch: null,
    });

    // Complete the agent task run
    const runs = db.getAgentTaskRunsByTask(taskId);
    const runningRun = runs.find(r => r.status === 'running');
    if (runningRun) {
      db.completeAgentTaskRun(runningRun.id);
    }

    res.json({
      task: updatedTask,
      merged: true,
      branch: task.worktree_branch,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Abort task worktree
router.post('/tasks/:id/abort', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const task = db.getTodoTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.worktree_path) {
      return res.status(400).json({ error: 'No worktree associated with this task' });
    }

    const todoList = db.getTodoList(task.list_id);
    if (!todoList) {
      return res.status(404).json({ error: 'Todo list not found' });
    }

    const project = db.getProject(todoList.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Remove worktree
    try {
      await execAsync(`git worktree remove --force ${task.worktree_path}`, { cwd: project.path });
    } catch {
      // Worktree might not exist, continue
    }

    // Delete the branch if it exists
    if (task.worktree_branch) {
      try {
        await execAsync(`git branch -D ${task.worktree_branch}`, { cwd: project.path });
      } catch {
        // Branch might not exist, continue
      }
    }

    // Update task status
    const updatedTask = db.updateTodoTask(taskId, {
      status: 'pending',
      worktree_path: null,
      worktree_branch: null,
    });

    // Abort the agent task run
    const runs = db.getAgentTaskRunsByTask(taskId);
    const runningRun = runs.find(r => r.status === 'running');
    if (runningRun) {
      db.abortAgentTaskRun(runningRun.id);
    }

    res.json({
      task: updatedTask,
      aborted: true,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// =====================
// AgentTaskRun Routes
// =====================

// Get runs for a task
router.get('/tasks/:taskId/runs', (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const runs = db.getAgentTaskRunsByTask(taskId);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get all running agent task runs
router.get('/runs/running', (req, res) => {
  try {
    const runs = db.getRunningAgentTaskRuns();
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
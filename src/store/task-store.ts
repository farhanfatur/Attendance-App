// Zustand Store - Task State Management

import { STORAGE_KEYS } from '@/src/config/constants';
import { apiClient } from '@/src/services/api/client';
import { offlineQueue } from '@/src/services/offline/queue-manager';
import { encryptedStorage } from '@/src/services/storage/encrypted-storage';
import { wsService } from '@/src/services/websocket/ws-service';
import { Task, TaskChecklistItem, TaskStatus, TaskUpdate } from '@/src/types';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

interface TaskFilters {
  status?: TaskStatus[];
  priority?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  taskUpdates: TaskUpdate[];
  filters: TaskFilters;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

interface TaskActions {
  // Fetching
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<Task | null>;
  fetchTaskUpdates: (taskId: string) => Promise<void>;
  
  // Task operations
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, notes?: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, notes?: string) => Promise<void>;
  addTaskNote: (taskId: string, note: string, photos?: string[]) => Promise<void>;
  updateChecklist: (taskId: string, itemId: string, completed: boolean) => Promise<void>;
  
  // Filters
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  
  // Real-time
  handleTaskUpdate: (update: Record<string, unknown>) => void;
  
  // State
  setCurrentTask: (task: Task | null) => void;
  setError: (error: string | null) => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  currentTask: null,
  taskUpdates: [],
  filters: {},
  isLoading: false,
  isUpdating: false,
  error: null,

  // Fetch tasks
  fetchTasks: async (filters?: TaskFilters) => {
    set({ isLoading: true, error: null });
    
    const currentFilters = filters || get().filters;
    
    try {
      const params: Record<string, string> = {};
      
      if (currentFilters.status?.length) {
        params.status = currentFilters.status.join(',');
      }
      if (currentFilters.priority?.length) {
        params.priority = currentFilters.priority.join(',');
      }
      if (currentFilters.dateRange) {
        params.startDate = currentFilters.dateRange.start;
        params.endDate = currentFilters.dateRange.end;
      }
      if (currentFilters.search) {
        params.search = currentFilters.search;
      }

      const response = await apiClient.get<Task[]>('/tasks', params);

      if (response.success && response.data) {
        set({ tasks: response.data });
        // Cache locally
        await encryptedStorage.setObject(STORAGE_KEYS.CACHED_TASKS, response.data);
      }
    } catch (error) {
      // Load from cache
      const cached = await encryptedStorage.getObject<Task[]>(STORAGE_KEYS.CACHED_TASKS);
      if (cached) {
        set({ tasks: cached });
      }
      console.error('Failed to fetch tasks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch single task
  fetchTaskById: async (taskId: string) => {
    set({ isLoading: true });
    
    try {
      const response = await apiClient.get<Task>(`/tasks/${taskId}`);

      if (response.success && response.data) {
        set({ currentTask: response.data });
        return response.data;
      }
      return null;
    } catch (error) {
      // Try to find in cached tasks
      const tasks = get().tasks;
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        set({ currentTask: task });
        return task;
      }
      console.error('Failed to fetch task:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch task updates/history
  fetchTaskUpdates: async (taskId: string) => {
    try {
      const response = await apiClient.get<TaskUpdate[]>(`/tasks/${taskId}/updates`);

      if (response.success && response.data) {
        set({ taskUpdates: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch task updates:', error);
    }
  },

  // Start task
  startTask: async (taskId: string) => {
    set({ isUpdating: true, error: null });
    
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const now = new Date().toISOString();
      const updatedTask: Task = {
        ...task,
        status: 'in_progress',
        startedAt: now,
        updatedAt: now,
        odSynced: false,
      };

      // Optimistic update
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
      }));

      // Send to server or queue
      try {
        await apiClient.patch(`/tasks/${taskId}/start`, {});
        
        // Mark as synced
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, odSynced: true } : t
          ),
        }));

        // Notify via WebSocket
        wsService.sendTaskUpdate(taskId, 'in_progress');
      } catch {
        await offlineQueue.enqueue('task_update', {
          taskId,
          status: 'in_progress',
          startedAt: now,
        });
      }

      await encryptedStorage.setObject(STORAGE_KEYS.CACHED_TASKS, get().tasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start task';
      set({ error: message });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Complete task
  completeTask: async (taskId: string, notes?: string) => {
    set({ isUpdating: true, error: null });
    
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const now = new Date().toISOString();
      const actualDuration = task.startedAt
        ? Math.floor((Date.now() - new Date(task.startedAt).getTime()) / (1000 * 60))
        : undefined;

      const updatedTask: Task = {
        ...task,
        status: 'completed',
        completedAt: now,
        actualDuration,
        notes: notes || task.notes,
        updatedAt: now,
        odSynced: false,
      };

      // Optimistic update
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
      }));

      // Send to server or queue
      try {
        await apiClient.patch(`/tasks/${taskId}/complete`, { notes });
        
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, odSynced: true } : t
          ),
        }));

        wsService.sendTaskUpdate(taskId, 'completed', { notes });
      } catch {
        await offlineQueue.enqueue('task_update', {
          taskId,
          status: 'completed',
          completedAt: now,
          notes,
        });
      }

      await encryptedStorage.setObject(STORAGE_KEYS.CACHED_TASKS, get().tasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete task';
      set({ error: message });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Update task status
  updateTaskStatus: async (taskId: string, status: TaskStatus, notes?: string) => {
    set({ isUpdating: true, error: null });
    
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const now = new Date().toISOString();
      const updatedTask: Task = {
        ...task,
        status,
        notes: notes || task.notes,
        updatedAt: now,
        odSynced: false,
      };

      // Optimistic update
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
      }));

      try {
        await apiClient.patch(`/tasks/${taskId}/status`, { status, notes });
        
        set(state => ({
          tasks: state.tasks.map(t => 
            t.id === taskId ? { ...t, odSynced: true } : t
          ),
        }));

        wsService.sendTaskUpdate(taskId, status, { notes });
      } catch {
        await offlineQueue.enqueue('task_update', {
          taskId,
          status,
          notes,
        });
      }

      await encryptedStorage.setObject(STORAGE_KEYS.CACHED_TASKS, get().tasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      set({ error: message });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  // Add note to task
  addTaskNote: async (taskId: string, note: string, photos?: string[]) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updateId = uuidv4();
      const now = new Date().toISOString();

      const taskUpdate: TaskUpdate = {
        id: updateId,
        taskId,
        userId: '', // Will be set by auth
        type: photos?.length ? 'photo' : 'note',
        newValue: note,
        attachments: photos,
        createdAt: now,
      };

      // Add to updates
      set(state => ({
        taskUpdates: [...state.taskUpdates, taskUpdate],
      }));

      try {
        await apiClient.post(`/tasks/${taskId}/notes`, { note, photos });
      } catch {
        await offlineQueue.enqueue('task_update', {
          taskId,
          type: 'note',
          note,
          photos,
        });
      }
    } catch (error) {
      console.error('Failed to add task note:', error);
    }
  },

  // Update checklist item
  updateChecklist: async (taskId: string, itemId: string, completed: boolean) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task?.checklistItems) return;

      const now = new Date().toISOString();
      const updatedChecklist: TaskChecklistItem[] = task.checklistItems.map(item =>
        item.id === itemId
          ? { ...item, isCompleted: completed, completedAt: completed ? now : undefined }
          : item
      );

      // Optimistic update
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, checklistItems: updatedChecklist } : t
        ),
        currentTask: state.currentTask?.id === taskId
          ? { ...state.currentTask, checklistItems: updatedChecklist }
          : state.currentTask,
      }));

      try {
        await apiClient.patch(`/tasks/${taskId}/checklist/${itemId}`, { completed });
      } catch {
        await offlineQueue.enqueue('task_update', {
          taskId,
          type: 'checklist',
          itemId,
          completed,
        });
      }
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  },

  // Set filters
  setFilters: (filters: TaskFilters) => {
    set({ filters });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Handle real-time task update
  handleTaskUpdate: (update: Record<string, unknown>) => {
    const taskId = update.taskId as string;
    const taskData = update.task as Partial<Task>;

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...taskData } : t
      ),
      currentTask: state.currentTask?.id === taskId
        ? { ...state.currentTask, ...taskData }
        : state.currentTask,
    }));
  },

  // Set current task
  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Subscribe to WebSocket task updates
wsService.on('task_update', (data) => {
  useTaskStore.getState().handleTaskUpdate(data);
});

export default useTaskStore;

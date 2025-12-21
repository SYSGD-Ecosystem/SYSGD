import { useState, useCallback, useEffect } from 'react';
import { SERVER_URL } from '@/utils/util';

export interface TaskType {
  name: string;
  color: string;
}

export interface TaskPriority {
  name: string;
  level: number;
  color: string;
}

export interface TaskState {
  name: string;
  color: string;
  requires_context: boolean;
}

export interface TaskConfig {
  types: TaskType[];
  priorities: TaskPriority[];
  states: TaskState[];
}

export function useTaskConfig(projectId: string) {
  const [config, setConfig] = useState<TaskConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener configuración de tareas');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching task config:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateConfig = useCallback(async (newConfig: TaskConfig) => {
    if (!projectId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ task_config: newConfig }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar configuración de tareas');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error updating task config:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addType = useCallback(async (type: Omit<TaskType, 'name'> & { name: string }) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(type),
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar tipo de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  const removeType = useCallback(async (typeName: string) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/types/${typeName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar tipo de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  const addState = useCallback(async (state: Omit<TaskState, 'name'> & { name: string }) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/states`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(state),
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar estado de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  const removeState = useCallback(async (stateName: string) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/states/${stateName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar estado de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  const addPriority = useCallback(async (priority: Omit<TaskPriority, 'name'> & { name: string }) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/priorities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(priority),
      });
      
      if (!response.ok) {
        throw new Error('Error al agregar prioridad de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  const removePriority = useCallback(async (priorityName: string) => {
    if (!projectId) return false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/projects/${projectId}/task-config/priorities/${priorityName}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar prioridad de tarea');
      }
      
      const data = await response.json();
      setConfig(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  }, [projectId]);

  // Auto-fetch config when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchConfig();
    }
  }, [projectId, fetchConfig]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
    addType,
    removeType,
    addState,
    removeState,
    addPriority,
    removePriority,
  };
}

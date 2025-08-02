import { useState, useEffect } from 'react';
import type { ProjectNote, CreateNoteData, UpdateNoteData } from '@/types/Note';

interface UseNotesResult {
  notes: ProjectNote[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  createNote: (data: CreateNoteData) => Promise<ProjectNote | null>;
  updateNote: (id: string, data: UpdateNoteData) => Promise<ProjectNote | null>;
  deleteNote: (id: string) => Promise<boolean>;
  refreshNotes: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useNotes = (projectId: number | string): UseNotesResult => {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener todas las notas del proyecto
  const fetchNotes = async (): Promise<void> => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/notes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setNotes(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar las notas';
      setError(errorMessage);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear una nueva nota
  const createNote = async (data: CreateNoteData): Promise<ProjectNote | null> => {
    if (!projectId) {
      console.log('❌ No projectId, returning null');
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const newNote = result.data;
      
      // Agregar la nueva nota al estado local
      setNotes(prevNotes => [newNote, ...prevNotes]);
      
      return newNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear la nota';
      setError(errorMessage);
      console.error('Error creating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una nota
  const updateNote = async (id: string, data: UpdateNoteData): Promise<ProjectNote | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const updatedNote = result.data;
      
      // Actualizar la nota en el estado local
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? updatedNote : note
        )
      );
      
      return updatedNote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al actualizar la nota';
      setError(errorMessage);
      console.error('Error updating note:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una nota
  const deleteNote = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Eliminar la nota del estado local
      setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al eliminar la nota';
      setError(errorMessage);
      console.error('Error deleting note:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para refrescar las notas
  const refreshNotes = async (): Promise<void> => {
    await fetchNotes();
  };

  // Cargar las notas al montar el componente o cuando cambie el projectId
  useEffect(() => {
    if (projectId) {
      fetchNotes();
    }
  }, [projectId]); // Removed fetchNotes from dependencies to avoid infinite loop

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    refreshNotes,
  };
};

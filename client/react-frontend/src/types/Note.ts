export interface ProjectNote {
  id: string;
  project_id: string; 
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_email?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

export interface NotesResponse {
  success: boolean;
  data: ProjectNote[];
  message?: string;
}

export interface NoteResponse {
  success: boolean;
  data: ProjectNote;
  message?: string;
}

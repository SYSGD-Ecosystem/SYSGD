export type Assignee = {
    id: string;
    name: string;
    email: string;
}

export type Task = {
  id: string
  created_at: string
  type: string
  priority: string
  title: string
  description?: string
  status: string
  assignees: Assignee[]
  project_id: string
  project_task_number?: number
}
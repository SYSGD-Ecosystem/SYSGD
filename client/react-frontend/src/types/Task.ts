export type Task = {
  id: string
  created_at: string
  type: string
  priority: string
  title: string
  description?: string
  status: string
  assignees: string
  project_id: string
  project_task_number?: number
}
export type TimeEntryStatus = "running" | "paused" | "completed";

export type TimeEntry = {
	id: string;
	user_id: string;
	project_id: string | null;
	task_id: string | null;
	start_time: string;
	end_time: string | null;
	duration_seconds: number | null;
	status: TimeEntryStatus;
	description: string | null;
	last_started_at: string | null;
	created_at: string;
	updated_at: string;
	project_name?: string | null;
	task_title?: string | null;
	task_number?: number | null;
	worker_name?: string | null;
	worker_email?: string | null;
};

export interface GitHubPullRequest {
	id: number;
	number: number;
	title: string;
	state: "open" | "closed" | "merged";
	created_at: string;
	updated_at: string;
	merged_at?: string;
	closed_at?: string;
	user: {
		login: string;
		id: number;
		avatar_url: string;
		html_url: string;
	};
	additions: number;
	deletions: number;
	changed_files: number;
	html_url: string;
	head: {
		ref: string;
		sha: string;
	};
	base: {
		ref: string;
		sha: string;
	};
}

export interface GitHubRepository {
	owner: string;
	repo: string;
	full_name: string;
	description?: string;
	private: boolean;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	open_issues_count: number;
	language: string;
	created_at: string;
	updated_at: string;
}

export interface GitHubConfig {
	owner: string;
	repo: string;
	token: string;
	isActive: boolean;
	projectId: string;
	createdAt: string;
	updatedAt: string;
}

export interface PullRequestFilters {
	state?: "open" | "closed" | "all";
	sort?: "created" | "updated" | "popularity";
	direction?: "asc" | "desc";
	dateFrom?: string; // YYYY-MM-DD format
	dateTo?: string; // YYYY-MM-DD format
}

export interface PaginatedPullRequests {
	pullRequests: GitHubPullRequest[];
	totalCount: number;
	currentPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface GitHubMetrics {
	totalPRs: number;
	openPRs: number;
	closedPRs: number;
	mergedPRs: number;
	totalAdditions: number;
	totalDeletions: number;
	averagePRSize: number;
	mergeRate: number;
}

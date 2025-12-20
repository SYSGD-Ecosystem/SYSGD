import { Octokit } from '@octokit/rest';

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
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

export interface PullRequestFilters {
  state?: 'open' | 'closed' | 'all';
  sort?: 'created' | 'updated' | 'popularity';
  direction?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
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

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async validateRepository(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({
        owner,
        repo,
      });
      return true;
    } catch (error) {
      console.error('Error validating repository:', error);
      return false;
    }
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });

      return {
        owner: data.owner.login,
        repo: data.name,
        full_name: data.full_name,
        description: data.description,
        private: data.private,
        html_url: data.html_url,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        open_issues_count: data.open_issues_count,
        language: data.language || 'Unknown',
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Error fetching repository info:', error);
      throw new Error('Failed to fetch repository information');
    }
  }

  async getPullRequests(
    owner: string,
    repo: string,
    page: number = 1,
    perPage: number = 50,
    filters: PullRequestFilters = {}
  ): Promise<PaginatedPullRequests> {
    try {
      // Build query parameters for GitHub API
      const queryParams: any = {
        owner,
        repo,
        state: filters.state || 'all',
        sort: filters.sort || 'created',
        direction: filters.direction || 'desc',
        page,
        per_page: perPage,
      };

      // Add date range filtering if provided
      if (filters.dateFrom || filters.dateTo) {
        // GitHub API doesn't directly support date range in pulls.list
        // We'll need to filter the results after fetching
        // For now, fetch all and filter client-side
        // TODO: Implement more efficient date filtering using search API if needed
      }

      const { data } = await this.octokit.pulls.list(queryParams);

      // Nota: GitHub NO incluye additions/deletions/changed_files en pulls.list.
      // Para mostrar esas métricas hay que pedir el detalle de cada PR (pulls.get).
      const pullRequestsBase: GitHubPullRequest[] = data.map((pr) => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        state: pr.state as 'open' | 'closed' | 'merged',
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        merged_at: pr.merged_at || undefined,
        closed_at: pr.closed_at || undefined,
        user: {
          login: pr.user.login,
          id: pr.user.id,
          avatar_url: pr.user.avatar_url,
          html_url: pr.user.html_url,
        },
        additions: 0,
        deletions: 0,
        changed_files: 0,
        html_url: pr.html_url,
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
        },
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
        },
      }));

      const pullRequests = await this.enrichPullRequestsWithStats(owner, repo, pullRequestsBase);

      // Apply date range filtering if provided
      let filteredPullRequests = pullRequests;
      if (filters.dateFrom || filters.dateTo) {
        filteredPullRequests = pullRequests.filter(pr => {
          const createdDate = new Date(pr.created_at);
          let matches = true;
          
          if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            matches = matches && createdDate >= fromDate;
          }
          
          if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            // Add one day to include the end date
            toDate.setDate(toDate.getDate() + 1);
            matches = matches && createdDate < toDate;
          }
          
          return matches;
        });
      }

      // Get total count for pagination (adjusted for date filtering)
      let totalCount = await this.getTotalPullRequestsCount(owner, repo, filters.state);
      if (filters.dateFrom || filters.dateTo) {
        // For date filtering, we need to estimate or calculate the actual count
        // For now, use the filtered count as approximation
        // TODO: Implement more accurate counting for date ranges
        totalCount = filteredPullRequests.length + (page - 1) * perPage;
      }
      const totalPages = Math.ceil(totalCount / perPage);

      return {
        pullRequests: filteredPullRequests,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw new Error('Failed to fetch pull requests');
    }
  }

  private async enrichPullRequestsWithStats(
    owner: string,
    repo: string,
    prs: GitHubPullRequest[]
  ): Promise<GitHubPullRequest[]> {
    const concurrency = 5;
    const queue = [...prs];
    const results: GitHubPullRequest[] = [];

    const worker = async () => {
      while (queue.length) {
        const pr = queue.shift();
        if (!pr) return;
        try {
          const { data } = await this.octokit.pulls.get({
            owner,
            repo,
            pull_number: pr.number,
          });

          results.push({
            ...pr,
            additions: typeof data.additions === 'number' ? data.additions : pr.additions,
            deletions: typeof data.deletions === 'number' ? data.deletions : pr.deletions,
            changed_files: typeof data.changed_files === 'number' ? data.changed_files : pr.changed_files,
          });
        } catch (error) {
          // Si el detalle falla (rate limit/permisos), devolvemos el PR sin stats.
          results.push(pr);
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    // Mantener el orden original
    const map = new Map(results.map((r) => [r.number, r]));
    return prs.map((pr) => map.get(pr.number) || pr);
  }

  private async getTotalPullRequestsCount(
    owner: string,
    repo: string,
    state?: string
  ): Promise<number> {
    try {
      const { data } = await this.octokit.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} type:pr${state ? ` state:${state}` : ''}`,
        per_page: 1, // Solo necesitamos el conteo
      });
      return data.total_count;
    } catch (error) {
      console.error('Error getting total PR count:', error);
      return 0;
    }
  }

  async getRepositoryMetrics(owner: string, repo: string): Promise<GitHubMetrics> {
    try {
      // Get all PRs (open and closed) for metrics
      const openPRs = await this.getPullRequests(owner, repo, 1, 100, { state: 'open' });
      const closedPRs = await this.getPullRequests(owner, repo, 1, 100, { state: 'closed' });

      const allPRs = [...openPRs.pullRequests, ...closedPRs.pullRequests];
      const mergedPRs = allPRs.filter(pr => pr.merged_at);

      const totalAdditions = allPRs.reduce((sum, pr) => sum + pr.additions, 0);
      const totalDeletions = allPRs.reduce((sum, pr) => sum + pr.deletions, 0);
      const averagePRSize = allPRs.length > 0 ? (totalAdditions + totalDeletions) / allPRs.length : 0;
      const mergeRate = closedPRs.pullRequests.length > 0 
        ? (mergedPRs.length / closedPRs.pullRequests.length) * 100 
        : 0;

      return {
        totalPRs: allPRs.length,
        openPRs: openPRs.pullRequests.length,
        closedPRs: closedPRs.pullRequests.length,
        mergedPRs: mergedPRs.length,
        totalAdditions,
        totalDeletions,
        averagePRSize,
        mergeRate,
      };
    } catch (error) {
      console.error('Error calculating repository metrics:', error);
      throw new Error('Failed to calculate repository metrics');
    }
  }
}

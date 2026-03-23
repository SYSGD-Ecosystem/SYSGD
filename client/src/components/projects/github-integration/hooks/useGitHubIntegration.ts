import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import type {
	GitHubMetrics,
	GitHubPullRequest,
	GitHubRepository,
	PullRequestFilters,
} from "@/types/GitHubTypes";

interface UseGitHubIntegrationProps {
	projectId: string;
	getGitHubCache: (projectId: string) => {
		repository: GitHubRepository | null;
		pullRequests: GitHubPullRequest[] | null;
		metrics: GitHubMetrics | null;
		pullRequestsKey?: string;
		pagination?: {
			currentPage: number;
			totalPages: number;
			totalCount: number;
		};
	} | null;
	setGitHubCache: (
		projectId: string,
		patch: {
			repository?: GitHubRepository | null;
			pullRequests?: GitHubPullRequest[] | null;
			metrics?: GitHubMetrics | null;
			pullRequestsKey?: string;
			pagination?: {
				currentPage: number;
				totalPages: number;
				totalCount: number;
			};
		},
	) => void;
	clearGitHubCache: (projectId: string) => void;
}

export default function useGitHubIntegration({
	projectId,
	getGitHubCache,
	setGitHubCache,
	clearGitHubCache,
}: UseGitHubIntegrationProps) {
	const [isConfigured, setIsConfigured] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [showConfig, setShowConfig] = useState(false);
	const [hasUserToken, setHasUserToken] = useState(false);
	const [showTokenForm, setShowTokenForm] = useState(false);
	const [isCheckingConfig, setIsCheckingConfig] = useState(true);

	// Configuration state (from project)
	const [repoUrl, setRepoUrl] = useState("");
	const [owner, setOwner] = useState("");
	const [repo, setRepo] = useState("");
	const [token, setToken] = useState("");

	// Data state
	const [repository, setRepository] = useState<GitHubRepository | null>(null);
	const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
	const [metrics, setMetrics] = useState<GitHubMetrics | null>(null);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	// Filters state
	const [filters, setFilters] = useState<PullRequestFilters>({
		state: "all",
		sort: "created",
		direction: "desc",
		dateFrom: "",
		dateTo: "",
	});

	// Load project config and user token status on mount
	useEffect(() => {
		const loadProjectConfig = async () => {
			try {
				const res = await api.get(`/api/github/project-config/${projectId}`);
				if (res.data.configured) {
					const cfg = res.data.configuration;
					setOwner(cfg.owner);
					setRepo(cfg.repo);
					setRepoUrl(`https://github.com/${cfg.owner}/${cfg.repo}`);
					setIsConfigured(true);

					// Load cached data from parent (survives mount/unmount between sidebar sections)
					const cached = getGitHubCache(projectId);
					if (cached?.repository) {
						setRepository(cached.repository);
					} else {
						fetchRepositoryInfo();
					}

					if (cached?.pullRequests) {
						setPullRequests(cached.pullRequests);
						if (cached.pagination) {
							setCurrentPage(cached.pagination.currentPage);
							setTotalPages(cached.pagination.totalPages);
							setTotalCount(cached.pagination.totalCount);
						}
					} else {
						fetchPullRequests();
					}

					if (cached?.metrics) {
						setMetrics(cached.metrics);
					} else {
						fetchMetrics();
					}
				} else {
					setShowConfig(true);
				}
			} catch (e) {
				console.error("Error loading project config", e);
			} finally {
				setIsCheckingConfig(false);
			}
		};

		const loadUserTokenStatus = async () => {
			try {
				const res = await api.get(`/api/github/user-token/${projectId}/status`);
				setHasUserToken(res.data.configured);
				if (!res.data.configured && isConfigured) {
					setShowTokenForm(true);
				}
			} catch (e) {
				console.error("Error loading user token status", e);
			}
		};

		loadProjectConfig();
		loadUserTokenStatus();
	}, [projectId]);

	const saveProjectConfig = async () => {
		if (!owner || !repo) {
			toast.error("Por favor completa owner y repo");
			return;
		}

		const toastId = toast.loading("Guardando configuración del repositorio...");
		try {
await api.post("/api/github/project-config", {
				projectId,
				owner,
				repo,
			});

			setIsConfigured(true);
			setShowConfig(false);
			setRepoUrl(`https://github.com/${owner}/${repo}`);
			toast.success("Configuración guardada. Ahora configura tu token.", {
				id: toastId,
			});
			setShowTokenForm(true);
			clearGitHubCache(projectId);
		} catch (e) {
			toast.error("Error al guardar configuración", { id: toastId });
		}
	};

	const validateRepository = async () => {
		if (!isConfigured) {
			toast.error("Primero guarda la configuración del repositorio");
			return;
		}

		if (!hasUserToken) {
			toast.error("Necesitas configurar tu token de GitHub para continuar");
			setShowTokenForm(true);
			return;
		}

		setIsValidating(true);
		const toastId = toast.loading("Validando repositorio...");
		try {
			const response = await api.post("/api/github/validate", { projectId });

			if (response.data?.valid) {
				setIsConfigured(true);
				setShowConfig(false);
				setShowTokenForm(false);
				toast.success("Repositorio validado correctamente", { id: toastId });
				clearGitHubCache(projectId);
				fetchRepositoryInfo();
				fetchPullRequests();
				fetchMetrics();
			} else {
				toast.error(response.data?.message || "No se pudo validar el repositorio", {
					id: toastId,
				});
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Error desconocido";
			toast.error(`Error al validar el repositorio: ${message}`, {
				id: toastId,
			});
		} finally {
			setIsValidating(false);
		}
	};

	const fetchRepositoryInfo = async () => {
		const cached = getGitHubCache(projectId);
		if (cached?.repository) {
			setRepository(cached.repository);
			return;
		}

		try {
			const response = await api.post("/api/github/repository", { projectId });
			setRepository(response.data);
			setGitHubCache(projectId, { repository: response.data });
		} catch (error) {
			console.error("Error fetching repository info:", error);
		}
	};

	const fetchPullRequests = async (page: number = 1) => {
		const pullRequestsKey = `${filters.state}|${filters.sort}|${filters.direction}|${page}`;
		const cached = getGitHubCache(projectId);
		if (cached?.pullRequests && cached.pullRequestsKey === pullRequestsKey) {
			setPullRequests(cached.pullRequests);
			if (cached.pagination) {
				setCurrentPage(cached.pagination.currentPage);
				setTotalPages(cached.pagination.totalPages);
				setTotalCount(cached.pagination.totalCount);
			}
			return;
		}

		setIsLoading(true);
		try {
			const queryParams = new URLSearchParams({
				page: page.toString(),
				perPage: "50",
				...(filters.state && { state: filters.state }),
				...(filters.sort && { sort: filters.sort }),
				...(filters.direction && { direction: filters.direction }),
				...(filters.dateFrom && { dateFrom: filters.dateFrom }),
				...(filters.dateTo && { dateTo: filters.dateTo }),
			});

			const response = await api.post(
				`/api/github/pull-requests?${queryParams}`,
				{ projectId },
			);

			setPullRequests(response.data.pullRequests);
			setCurrentPage(response.data.currentPage);
			setTotalPages(response.data.totalPages);
			setTotalCount(response.data.totalCount);
			setGitHubCache(projectId, {
				pullRequests: response.data.pullRequests,
				pullRequestsKey,
				pagination: {
					currentPage: response.data.currentPage,
					totalPages: response.data.totalPages,
					totalCount: response.data.totalCount,
				},
			});
		} catch (error) {
			toast.error("Error al cargar los Pull Requests");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchMetrics = async () => {
		const cached = getGitHubCache(projectId);
		if (cached?.metrics) {
			setMetrics(cached.metrics);
			return;
		}

		try {
			const response = await api.post("/api/github/metrics", { projectId });
			setMetrics(response.data);
			setGitHubCache(projectId, { metrics: response.data });
		} catch (error) {
			console.error("Error fetching metrics:", error);
		}
	};

	const saveUserToken = async () => {
		if (!token) {
			toast.error("Por favor ingresa tu token de GitHub");
			return;
		}
		const toastId = toast.loading("Guardando token...");
		try {
			await api.post("/api/github/user-token", { projectId, token });
			toast.success("Token guardado correctamente", { id: toastId });
			setHasUserToken(true);
			setShowTokenForm(false);
			setToken("");
			validateRepository();
			// Now we can fetch data
			fetchRepositoryInfo();
			fetchPullRequests();
			fetchMetrics();
		} catch (e) {
			toast.error("Error al guardar token", { id: toastId });
		}
	};

	const handleFilterChange = (key: keyof PullRequestFilters, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleRefresh = () => {
		fetchPullRequests(1); // Reset to page 1 when applying filters
		fetchMetrics();
	};

	// Apply filters when they change
	useEffect(() => {
		if (
			filters.state ||
			filters.sort ||
			filters.direction ||
			filters.dateFrom ||
			filters.dateTo
		) {
			handleRefresh();
		}
	}, [
		filters.state,
		filters.sort,
		filters.direction,
		filters.dateFrom,
		filters.dateTo,
	]);

	const parseAndSetRepoFromUrl = (value: string) => {
		setRepoUrl(value);

		const trimmed = value.trim();
		if (!trimmed) return;

		// Soporta:
		// - https://github.com/OWNER/REPO
		// - git@github.com:OWNER/REPO.git
		// - OWNER/REPO
		const match = trimmed.match(
			/^(?:https?:\/\/github\.com\/|git@github\.com:)?([^\s/]+)\/([^\s/]+?)(?:\.git)?\/?$/i,
		);
		if (!match) return;

		const parsedOwner = match[1];
		const parsedRepo = match[2];

		if (parsedOwner) setOwner(parsedOwner);
		if (parsedRepo) setRepo(parsedRepo);
	};

	return {
		// State
		isConfigured,
		isLoading,
		isValidating,
		showConfig,
		hasUserToken,
		showTokenForm,
		isCheckingConfig,
		repoUrl,
		owner,
		repo,
		token,
		repository,
		pullRequests,
		metrics,
		currentPage,
		totalPages,
		totalCount,
		filters,

		// Setters
		setShowConfig,
		setShowTokenForm,
		setRepoUrl,
		setOwner,
		setRepo,
		setToken,

		// Functions
		saveProjectConfig,
		validateRepository,
		fetchRepositoryInfo,
		fetchPullRequests,
		fetchMetrics,
		saveUserToken,
		handleFilterChange,
		handleRefresh,
		parseAndSetRepoFromUrl,
	};
}
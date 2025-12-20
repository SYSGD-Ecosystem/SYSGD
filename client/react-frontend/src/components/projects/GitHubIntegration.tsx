import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Loader2, Github, ExternalLink, Settings, BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';
import { GitHubPullRequest, GitHubRepository, GitHubMetrics, PullRequestFilters } from '@/types/GitHubTypes';
import useExportTable from '@/hooks/useExportTable';

interface GitHubIntegrationProps {
  projectId: string;
  getGitHubCache: (projectId: string) => {
    repository: GitHubRepository | null;
    pullRequests: GitHubPullRequest[] | null;
    metrics: GitHubMetrics | null;
    pullRequestsKey?: string;
    pagination?: { currentPage: number; totalPages: number; totalCount: number };
  } | null;
  setGitHubCache: (
    projectId: string,
    patch: {
      repository?: GitHubRepository | null;
      pullRequests?: GitHubPullRequest[] | null;
      metrics?: GitHubMetrics | null;
      pullRequestsKey?: string;
      pagination?: { currentPage: number; totalPages: number; totalCount: number };
    },
  ) => void;
  clearGitHubCache: (projectId: string) => void;
}

export default function GitHubIntegration({
  projectId,
  getGitHubCache,
  setGitHubCache,
  clearGitHubCache,
}: GitHubIntegrationProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [hasUserToken, setHasUserToken] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  
  // Configuration state (from project)
  const [repoUrl, setRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  
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
    state: 'all',
    sort: 'created',
    direction: 'desc',
    dateFrom: '',
    dateTo: ''
  });

  const { exportToXlsx } = useExportTable();

  // Load project config and user token status on mount
  useEffect(() => {
    const loadProjectConfig = async () => {
      try {
        const res = await fetch(`/api/github/project-config/${projectId}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.configured) {
            const cfg = data.configuration;
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
        }
      } catch (e) {
        console.error('Error loading project config', e);
      } finally {
        setIsCheckingConfig(false);
      }
    };

    const loadUserTokenStatus = async () => {
      try {
        const res = await fetch(`/api/github/user-token/${projectId}/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setHasUserToken(data.configured);
          if (!data.configured && isConfigured) {
            setShowTokenForm(true);
          }
        }
      } catch (e) {
        console.error('Error loading user token status', e);
      }
    };

    loadProjectConfig();
    loadUserTokenStatus();
  }, [projectId]);

  const saveProjectConfig = async () => {
    if (!owner || !repo) {
      toast.error('Por favor completa owner y repo');
      return;
    }

    const toastId = toast.loading('Guardando configuración del repositorio...');
    try {
      const response = await fetch('/api/github/project-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId, owner, repo }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(data?.message || 'Error al guardar configuración', { id: toastId });
        return;
      }

      setIsConfigured(true);
      setShowConfig(false);
      setRepoUrl(`https://github.com/${owner}/${repo}`);
      toast.success('Configuración guardada. Ahora configura tu token.', { id: toastId });
      setShowTokenForm(true);
      clearGitHubCache(projectId);
    } catch (e) {
      toast.error('Error al guardar configuración', { id: toastId });
    }
  };

  const validateRepository = async () => {
    if (!isConfigured) {
      toast.error('Primero guarda la configuración del repositorio');
      return;
    }

    if (!hasUserToken) {
      toast.error('Necesitas configurar tu token de GitHub para continuar');
      setShowTokenForm(true);
      return;
    }

    setIsValidating(true);
    const toastId = toast.loading('Validando repositorio...');
    try {
      const response = await fetch('/api/github/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const messageFromApi = data?.message || data?.error;
        const message = messageFromApi
          ? String(messageFromApi)
          : raw
            ? String(raw).slice(0, 200)
            : `Error HTTP ${response.status}`;
        toast.error(`Error al validar: ${message}`, { id: toastId });
        return;
      }

      if (data?.valid) {
        setIsConfigured(true);
        setShowConfig(false);
        setShowTokenForm(false);
        toast.success('Repositorio validado correctamente', { id: toastId });
        clearGitHubCache(projectId);
        fetchRepositoryInfo();
        fetchPullRequests();
        fetchMetrics();
      } else {
        toast.error(data?.message || 'No se pudo validar el repositorio', { id: toastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`Error al validar el repositorio: ${message}`, { id: toastId });
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
      const response = await fetch('/api/github/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        setRepository(data);
        setGitHubCache(projectId, { repository: data });
      }
    } catch (error) {
      console.error('Error fetching repository info:', error);
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
        perPage: '50',
        ...(filters.state && { state: filters.state }),
        ...(filters.sort && { sort: filters.sort }),
        ...(filters.direction && { direction: filters.direction }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/github/pull-requests?${queryParams}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPullRequests(data.pullRequests);
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
        setGitHubCache(projectId, {
          pullRequests: data.pullRequests,
          pullRequestsKey,
          pagination: {
            currentPage: data.currentPage,
            totalPages: data.totalPages,
            totalCount: data.totalCount,
          },
        });
      }
    } catch (error) {
      toast.error('Error al cargar los Pull Requests');
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
      const response = await fetch('/api/github/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setGitHubCache(projectId, { metrics: data });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const saveUserToken = async () => {
    if (!token) {
      toast.error('Por favor ingresa tu token de GitHub');
      return;
    }
    const toastId = toast.loading('Guardando token...');
    try {
      const res = await fetch('/api/github/user-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId, token }),
      });
      if (res.ok) {
        toast.success('Token guardado correctamente', { id: toastId });
        setHasUserToken(true);
        setShowTokenForm(false);
        setToken('');
        validateRepository();
        // Now we can fetch data
        fetchRepositoryInfo();
        fetchPullRequests();
        fetchMetrics();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Error al guardar token', { id: toastId });
      }
    } catch (e) {
      toast.error('Error al guardar token', { id: toastId });
    }
  };

  const handleFilterChange = (key: keyof PullRequestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (filters.state || filters.sort || filters.direction) {
      fetchPullRequests(1);
    }
  }, [filters]);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'open':
        return <Badge variant="secondary" className="text-green-600">Abierto</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="text-red-600">Cerrado</Badge>;
      case 'merged':
        return <Badge variant="secondary" className="text-purple-600">Mergeado</Badge>;
      default:
        return <Badge variant="secondary">{state}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseAndSetRepoFromUrl = (value: string) => {
    setRepoUrl(value);

    const trimmed = value.trim();
    if (!trimmed) return;

    // Soporta:
    // - https://github.com/OWNER/REPO
    // - git@github.com:OWNER/REPO.git
    // - OWNER/REPO
    const match = trimmed.match(
      /^(?:https?:\/\/github\.com\/|git@github\.com:)?([^\s\/]+)\/([^\s\/]+?)(?:\.git)?\/?$/i
    );
    if (!match) return;

    const parsedOwner = match[1];
    const parsedRepo = match[2];

    if (parsedOwner) setOwner(parsedOwner);
    if (parsedRepo) setRepo(parsedRepo);
  };

  if (isCheckingConfig) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Configuración de GitHub
            </CardTitle>
            <CardDescription>
              Conecta un repositorio de GitHub para monitorear Pull Requests y métricas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="repoUrl">URL del repositorio (opcional)</Label>
              <Input
                id="repoUrl"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(e) => parseAndSetRepoFromUrl(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Puedes pegar la URL completa o usar el formato <span className="font-mono">owner/repo</span>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner">Owner</Label>
                <Input
                  id="owner"
                  placeholder="ej: facebook"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="repo">Repository</Label>
                <Input
                  id="repo"
                  placeholder="ej: react"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Alert>
                <AlertDescription>
                  Primero guarda el repositorio del proyecto. Luego cada usuario debe ingresar su token personal.
                </AlertDescription>
              </Alert>
            </div>
            <Button 
              onClick={saveProjectConfig} 
              disabled={isValidating}
              className="w-full"
            >
              {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Repositorio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Github className="w-6 h-6" />
            GitHub Integration
          </h1>
          {repository && (
            <p className="text-gray-600">
              {repository.full_name} - {repository.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {pullRequests.length > 0 && (
            <Button
              variant="outline"
              onClick={exportToXlsx}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar a Excel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
              </div>
              <div>
                <Label>Repository</Label>
                <Input value={repo} onChange={(e) => setRepo(e.target.value)} />
              </div>
            </div>
            <Button onClick={saveProjectConfig} disabled={isValidating}>
              {isValidating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Token Panel */}
      {(showTokenForm || (!hasUserToken && isConfigured)) && (
        <Card>
          <CardHeader>
            <CardTitle>Token de GitHub</CardTitle>
            <CardDescription>
              Cada usuario debe configurar su token personal para este proyecto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>GitHub Token</Label>
              <Input
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Token con permisos de lectura (public_repo)
              </p>
            </div>
            <Button onClick={saveUserToken}>
              Guardar Token
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Métricas del Repositorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalPRs}</div>
                <div className="text-sm text-gray-600">Total PRs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.openPRs}</div>
                <div className="text-sm text-gray-600">Abiertos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{metrics.mergedPRs}</div>
                <div className="text-sm text-gray-600">Mergeados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.mergeRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Tasa de Merge</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <Label>Estado</Label>
              <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abiertos</SelectItem>
                  <SelectItem value="closed">Cerrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordenar por</Label>
              <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Fecha de creación</SelectItem>
                  <SelectItem value="updated">Fecha de actualización</SelectItem>
                  <SelectItem value="popularity">Popularidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dirección</Label>
              <Select value={filters.direction} onValueChange={(value) => handleFilterChange('direction', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descendente</SelectItem>
                  <SelectItem value="asc">Ascendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
            <div>
              <Label>Fecha hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pull Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pull Requests ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table id="myTable">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right truncate">Líneas +</TableHead>
                    <TableHead className="text-right truncate">Líneas -</TableHead>
                    <TableHead className="text-right truncate">Archivos</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pullRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-mono text-sm">#{pr.number}</TableCell>
                      <TableCell className="max-w-xs truncate">{pr.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img 
                            src={pr.user.avatar_url} 
                            alt={pr.user.login}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm">{pr.user.login}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStateBadge(pr.state)}</TableCell>
                      <TableCell className="text-sm truncate">{formatDate(pr.created_at)}</TableCell>
                      <TableCell className="text-right text-sm truncate">
                        <span className="text-green-600">+{pr.additions}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm truncate">
                        <span className="text-red-600">-{pr.deletions}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">{pr.changed_files}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={pr.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => fetchPullRequests(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => fetchPullRequests(i + 1)}
                            isActive={currentPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => fetchPullRequests(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { DescubrePostCard } from "@/components/descubre-post-card";
import { LoginDialog } from "@/components/login-dialog";
import { PostEditDialog } from "@/components/post-edit-dialog";
import useDescubrePosts, {
  type DescubrePost,
  type DescubrePostInput,
} from "@/hooks/useDescubrePosts";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const ITEMS_PER_PAGE = 9;

export default function DescubrePage() {
  const { posts, loading, error, refetch, votePost, updatePost, deletePost } =
    useDescubrePosts();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DescubrePost | null>(null);

  const safePosts = Array.isArray(posts) ? posts : [];
  const totalPages = Math.ceil(safePosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPosts = safePosts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  function requireLogin(): boolean {
    if (user) return true;
    setLoginOpen(true);
    return false;
  }

  async function handleVote(post: DescubrePost) {
    if (!requireLogin()) return;
    await votePost(post.id);
  }

  function handleDelete(post: DescubrePost) {
    if (
      window.confirm(
        `¿Eliminar tu publicación "${post.title}"? Esta acción no se puede deshacer.`,
      )
    ) {
      void deletePost(post.id);
    }
  }

  async function handleSaveEdit(
    postId: string,
    input: DescubrePostInput,
  ): Promise<DescubrePost | null> {
    return updatePost(postId, input);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-6">
              <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Descubre
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
              Explora lo que nuestra comunidad tiene para ti. Productos,
              servicios y oportunidades publicadas por usuarios de SYSGD.
            </p>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : safePosts.length === 0 ? (
            <EmptyState />
          ) : (
            <PostsList
              posts={paginatedPosts}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              totalItems={safePosts.length}
              currentUserId={user?.id ?? null}
              onVote={handleVote}
              onEdit={(post) => setEditingPost(post)}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PostEditDialog
        key={editingPost?.id ?? "none"}
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
        <div
          className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-blue-400 dark:border-b-blue-600 rounded-full animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Cargando publicaciones...
        </p>
        <p className="text-sm text-muted-foreground">
          Esto solo tomará un momento
        </p>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6 max-w-md mx-auto text-center px-4">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Oops, algo salió mal
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          No pudimos cargar las publicaciones en este momento. Por favor,
          verifica tu conexión e intenta nuevamente.
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry || (() => window.location.reload())}
        className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
      >
        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        Reintentar
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col justify-center items-center min-h-[500px] gap-6 max-w-md mx-auto text-center px-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
          <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">0</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Aún no hay publicaciones
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Sé el primero en compartir lo que tienes. Los usuarios Pro y VIP
          pueden publicar productos y servicios en Descubre.
        </p>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Vuelve pronto para descubrir lo que nuestra comunidad tiene para ti
        </p>
      </div>
    </div>
  );
}

type PostsListProps = {
  posts: ReturnType<typeof useDescubrePosts>["posts"];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  currentUserId?: string | null;
  onVote?: (post: DescubrePost) => void;
  onEdit?: (post: DescubrePost) => void;
  onDelete?: (post: DescubrePost) => void;
};

function PostsList({
  posts,
  totalPages,
  currentPage,
  onPageChange,
  totalItems,
  currentUserId,
  onVote,
  onEdit,
  onDelete,
}: PostsListProps) {
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-medium text-muted-foreground">
          Mostrando {startItem}-{endItem} de {totalItems}{" "}
          {totalItems === 1 ? "publicación" : "publicaciones"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <DescubrePostCard
              post={post}
              currentUserId={currentUserId}
              onVote={onVote}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="mt-16 max-w-3xl mx-auto text-center border-t border-gray-200 dark:border-gray-800 pt-8 px-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Aviso sobre el contenido:</strong> Las publicaciones
          presentadas en esta sección son creadas y gestionadas de forma
          independiente por los usuarios de la comunidad. SYSGD actúa únicamente
          como proveedor tecnológico y no se responsabiliza por la veracidad o
          legalidad del contenido de terceros. Si detectas alguna publicación
          fraudulenta, inapropiada o que vulnere derechos, repórtala de
          inmediato a{" "}
          <a
            href="mailto:legal@ecosysgd.com"
            className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-700"
          >
            legal@ecosysgd.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}

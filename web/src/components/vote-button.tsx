import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoteButtonProps {
	votesCount: number
	voted: boolean
	onVote: () => Promise<boolean | null> | void
	requireAuth?: () => boolean
}

/**
 * Botón de voto ("energía") de una publicación.
 * requireAuth devuelve false si el usuario no está logueado (para abrir el login).
 */
export function VoteButton({ votesCount, voted, onVote, requireAuth }: VoteButtonProps) {
	const [pending, setPending] = useState(false)

	async function handleClick() {
		if (requireAuth && !requireAuth()) return
		setPending(true)
		try {
			await onVote()
		} finally {
			setPending(false)
		}
	}

	return (
		<Button
			variant={voted ? "default" : "outline"}
			size="sm"
			onClick={(e) => {
				e.stopPropagation()
				handleClick()
			}}
			disabled={pending}
			className={cn(
				"gap-1.5 font-semibold select-none",
				voted && "bg-blue-600 hover:bg-blue-700 text-white",
			)}
			aria-pressed={voted}
			title={voted ? "Quitar voto" : "Votar publicación"}
		>
			<ChevronUp className="w-4 h-4" />
			{votesCount ?? 0}
		</Button>
	)
}

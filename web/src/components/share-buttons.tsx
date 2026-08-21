import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Facebook, Link2, MessageCircle, Send, Share2, Twitter } from "lucide-react"

interface ShareButtonsProps {
	url: string
	title: string
	text?: string
}

export function ShareButtons({ url, title, text }: ShareButtonsProps) {
	const [copied, setCopied] = useState(false)

	const shareText = [text ?? title, url].filter(Boolean).join(" — ")
	const encodedUrl = encodeURIComponent(url)
	const encodedText = encodeURIComponent(shareText)

	const canNativeShare =
		typeof navigator !== "undefined" && typeof navigator.share === "function"

	const links = [
		{
			label: "Compartir en WhatsApp",
			icon: <MessageCircle className="w-4 h-4" />,
			href: `https://wa.me/?text=${encodedText}`,
		},
		{
			label: "Compartir en Facebook",
			icon: <Facebook className="w-4 h-4" />,
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
		},
		{
			label: "Compartir en X",
			icon: <Twitter className="w-4 h-4" />,
			href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(
				text ?? title,
			)}`,
		},
		{
			label: "Compartir en Telegram",
			icon: <Send className="w-4 h-4" />,
			href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(
				text ?? title,
			)}`,
		},
	]

	async function handleNativeShare() {
		try {
			await navigator.share({ title, text: text ?? title, url })
		} catch {
			// usuario canceló o no hay soporte
		}
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(url)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch {
			// portapapeles no disponible
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			{canNativeShare && (
				<Button size="sm" onClick={handleNativeShare}>
					<Share2 className="w-4 h-4" />
					Compartir
				</Button>
			)}

			{links.map((item) => (
				<Button key={item.label} variant="outline" size="sm" asChild>
					<a
						href={item.href}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={item.label}
						title={item.label}
					>
						{item.icon}
					</a>
				</Button>
			))}

			<Button
				variant={copied ? "default" : "outline"}
				size="sm"
				onClick={handleCopy}
				aria-label="Copiar enlace"
				title="Copiar enlace"
			>
				{copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
				{copied ? "¡Copiado!" : "Copiar enlace"}
			</Button>
		</div>
	)
}

import { Bot, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AgentsChatPage() {
	const navigate = useNavigate();

	return (
		<div className="h-screen bg-background flex items-center justify-center p-6">
			<div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 text-center space-y-4">
				<div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
					<Bot className="h-6 w-6" />
				</div>
				<h1 className="text-xl font-semibold">Módulo de chat con agentes</h1>
				<p className="text-sm text-muted-foreground">
					Las conversaciones con agentes externos se gestionan en este espacio
					dedicado para mantener el chat interno enfocado en colaboración de
					equipos.
				</p>
				<div className="flex items-center justify-center gap-2">
					<Button onClick={() => navigate("/chat")}>Ir a chat interno</Button>
					<Button variant="outline" onClick={() => navigate("/dashboard")}>
						<ArrowLeftRight className="h-4 w-4 mr-2" />
						Volver al dashboard
					</Button>
				</div>
			</div>
		</div>
	);
}

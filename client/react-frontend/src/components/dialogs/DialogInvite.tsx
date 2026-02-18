import { type FC, useState } from "react";
import { useInvitations } from "@/hooks/connection/useProjectMembers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const DialogInvite: FC<{
	projectId: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}> = ({ projectId, isOpen, onOpenChange }) => {
	const { toast } = useToast();
	const { sendInvitation } = useInvitations();
	const [invitation, setInvitation] = useState({
		projectId,
		email: "",
		role: "",
	});

	const handleInvitation = () => {
		console.log(invitation);
		sendInvitation(
			invitation.projectId,
			invitation.email,
			invitation.role,
			() => {
				onOpenChange(false);
				toast({ title: "Exito", description: "Invitacion enviada" });
			},
			() => {
				toast({ title: "Error", description: "No se envio la invitacion" });
			},
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md mx-4">
				<DialogHeader>
					<DialogTitle className="text-gray-900 dark:text-white">
						Nuevo Miembro
					</DialogTitle>
				</DialogHeader>
				{
					<div className="space-y-4">
						<div>
							<div>
								<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Email
								</Label>
								<Input
									type="email"
									onChange={(e) =>
										setInvitation({
											...invitation,
											email: e.target.value,
										})
									}
									placeholder="correo@ejemplo.com"
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
								/>
							</div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Rol
							</Label>
							<Input
								onChange={(e) =>
									setInvitation({ ...invitation, role: e.target.value })
								}
								placeholder="Rol en el equipo"
								className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button onClick={handleInvitation}>Invitar</Button>
						</div>
					</div>
				}
			</DialogContent>
		</Dialog>
	);
};

export default DialogInvite;

import { type FC, useState } from "react";
import Input from "../Input";
import Button from "../Button";
import Text from "../Text";
import useConnection from "../../hooks/connection/useConnection";
import { IoCloseCircle } from "react-icons/io5";
import { toast } from "sonner";

const CreateArchiving: FC<{ onClose: () => void; onCreate: () => void }> = ({
	onClose,
	onCreate,
}) => {
	const [newDocument, setNewDocument] = useState({
		company: "",
		name: "",
		code: "",
	});
	const { handleNewArchiving } = useConnection();

	const handleNewArchive = (e: React.FormEvent) => {
		e.preventDefault();
		handleNewArchiving(
			newDocument.code,
			newDocument.company,
			newDocument.name,
			() => {
				toast.success("Archivo de Gestión creado correctamente");
				onCreate();
				onClose();
			},
			() => {
				toast.error("Error al crear nuevo archivo de gestión");
				onClose();
			},
		);
	};
	return (
		<form
			onSubmit={handleNewArchive}
			className="w-80 p-4 bg-white dark:bg-slate-900 rounded-lg flex flex-col gap-2 shadow-lg"
		>
			<div className="flex items-center justify-center">
				<Text className="w-full" label="Crear Archivo de Gestión" variant={0} />
				<IoCloseCircle
					className="text-slate-800 dark:text-slate-200 text-lg cursor-pointer"
					onClick={onClose}
				/>
			</div>

			<Input
				type="text"
				label="Empresa"
				onChange={(v) => {
					setNewDocument({ ...newDocument, company: v });
				}}
			/>
			<Input
				type="text"
				label="Archivo de Gestion"
				onChange={(v) => {
					setNewDocument({ ...newDocument, name: v });
				}}
			/>
			<Input
				type="text"
				label="Código"
				onChange={(v) => {
					setNewDocument({ ...newDocument, code: v });
				}}
			/>
			<div className="flex gap-1 items-center justify-center py-3">
				<Button>Crear</Button>
			</div>
		</form>
	);
};

export default CreateArchiving;

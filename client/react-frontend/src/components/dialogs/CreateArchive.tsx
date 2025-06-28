import { type FC, useState } from "react";
import Input from "../Input";
import Button from "../Button";
import Text from "../Text";
import useConnection from "../../hooks/connection/useConnection";
import { IoCloseCircle } from "react-icons/io5";
import { useToast } from "../../hooks/useToast";

const CreateArchiving: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addToast } = useToast();
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { handleNewArchiving } = useConnection();

  const handleNewArchive = (e: React.FormEvent) => {
    e.preventDefault();
    handleNewArchiving(
      code,
      company,
      name,
      () => {
        addToast("Archivo de Gestión creado correctamente", "positive");
        onClose();
      },
      () => {
        alert("Error al crear nuevo archivo de gestion");
      }
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

      <Input type="text" label="Empresa" onChange={setCompany} />
      <Input type="text" label="Archivo de Gestion" onChange={setName} />
      <Input type="text" label="Código" onChange={setCode} />
      <div className="flex gap-1 items-center justify-center py-3">
        <Button>Crear</Button>
      </div>
    </form>
  );
};

export default CreateArchiving;

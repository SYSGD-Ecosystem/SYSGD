import { FC } from "react";
import TextInput from "./TextInput";
import ToolBar from "./ToolBar";
import Button from "./Button";
import Select from "./Select";

const SecondarySidebar: FC = () => {
  return (
    <>
      <div className="max-w-64 w-full h-full overflow-auto border-l dark:border-slate-700 bg-white dark:bg-slate-950 flex flex-col gap-2">
        <ToolBar />

        <div className="flex size-full flex-col overflow-auto">
          <div className="flex flex-col gap-2 px-2 pb-2">
            <TextInput label="Código" />
            <TextInput label="Serie o Subserie Documental " />
            <Select
              label="Valoración"
              options={[
                { select: "Temporal", onClick: () => {} },
                { select: "Permanente", onClick: () => {} },
              ]}
            />
            <Select
              label="Soporte"
              options={[
                { select: "Papel", onClick: () => {} },
                { select: "Digital", onClick: () => {} },
              ]}
            />
            <Select
              label="Acceso"
              options={[
                { select: "Libre", onClick: () => {} },
                { select: "Restringido", onClick: () => {} },
              ]}
            />

            <TextInput label="Plazo de Retención AG" />
            <TextInput label="Plazo de Retención AC" />
            <TextInput label="Observaciones" />
            <Button onClick={() => {}} >Insertar</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecondarySidebar;

import { FC, useState } from "react";
import { EMPTY_GENERALES } from "../accountingMath";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import {
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  CloudWorkspaceEntry,
  CuentaContable,
} from "@/accounting/core/types/accountingTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DialogAddDiaryOperation: FC<{ workspace: CloudWorkspaceEntry }> = ({
  workspace,
}) => {


  // const [operation, setOperation] = useState<LibroDiarioListOperations>([])
  
  const generales = workspace.registro.generales ?? EMPTY_GENERALES;

  const cuentas = workspace.accounting.cuentasContables;

  const [showEditDialog, setShowEditDialog] = useState(false);

  const [fiscalMunicipio, setFiscalMunicipio] = useState(
    generales.fiscalMunicipio,
  );

  // setOperation()

  

  return (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={() => setShowEditDialog(true)}>
          <Edit2 /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <DialogTitle>Registrar operación</DialogTitle>
          <DialogDescription></DialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-4">
          <div className="grid gap-2">
            <div className="text-base font-bold">Debe</div>
          </div>

          <div className="flex gap-2">
            <div className="w-full">
              <Label>Cuenta</Label>
              <Select
                value={fiscalMunicipio}
                onValueChange={setFiscalMunicipio}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((c) => {
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="importe">Importe</Label>
              <Input
                id="importe"
                placeholder="0.00"
                value={""}
                onChange={(_e) => {}}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-base font-bold">Haber</div>
          </div>

          <RegisterInput cuentas={cuentas} />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => setShowEditDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              setShowEditDialog(false);
            }}
          >
            {"Gardando..."}
          </Button>
        </AlertDialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogAddDiaryOperation;

const RegisterInput: FC<{ cuentas: CuentaContable[] }> = ({ cuentas }) => {
  const [importe, setImporte] = useState(0);
  const [name, setName] = useState("ddd");

  return (
    <div className="flex gap-2">
      <div className="w-full">
        <Label>Cuenta</Label>
        <Select value={name} onValueChange={setName}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cuenta" />
          </SelectTrigger>
          <SelectContent>
            {cuentas.map((c) => {
              return (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="importe">Importe</Label>
        <Input
          id="importe"
          placeholder="0.00"
          value={importe}
          onChange={(e) => {
            setImporte(Number.parseFloat(e.target.value));
          }}
        />
      </div>
    </div>
  );
};

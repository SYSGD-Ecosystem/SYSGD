import { useState } from "react";
import AlertDialog from "../components/AlertDialog";

interface DialogProps {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  DialogComponent: (onClick: () => void, message: string) => JSX.Element;
}

const useAlertDialog = (): DialogProps => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const DialogComponent = (onClick: () => void, message: string) =>
    isOpen ? (
      <div className="fixed left-0 top-0 dark:text-slate-200 font-extralight size-full flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
        <AlertDialog
          message={message}
          onClick={() => {
            onClick();
            closeDialog();
          }}
          onCancel={closeDialog}
        />
      </div>
    ) : (
      <></>
    );

  return {
    isOpen,
    openDialog,
    closeDialog,
    DialogComponent,
  };
};

export default useAlertDialog;

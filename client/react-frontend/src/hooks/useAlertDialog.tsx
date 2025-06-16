import { useState } from "react";
import AlertDialog from "../components/AlertDialog";

interface DialogProps {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  AlertDialogComponent: (onClick: () => void, message: string) => JSX.Element;
}

const useAlertDialog = (): DialogProps => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const AlertDialogComponent = (onClick: () => void, message: string) =>
    isOpen ? (
      <div className="fixed left-0 top-0 dark:text-slate-200 font-extralight size-full flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-40 inset-0 backdrop-blur-sm">
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
    AlertDialogComponent,
  };
};

export default useAlertDialog;

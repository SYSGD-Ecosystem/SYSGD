import { useState, ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  DialogComponent: ({ children }: { children: ReactNode }) => JSX.Element;
}

const useDialog = (): DialogProps => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  const DialogComponent = ({ children }: { children: ReactNode }) =>
    isOpen ? (
      <div className="size-full bg-[rgba(0,0,0,0.5)] shadow-lg flex items-center justify-center">
        {children}
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

export default useDialog;

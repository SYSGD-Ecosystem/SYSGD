import { FC } from "react";
import Button from "../components/Button";

const Print: FC = () => {
  return (
    <div className="bg-slate-200">
      <div className="fixed bottom-10 right-10 print:hidden">
        <Button
          onClick={() => {
            window.print();
          }}
        >
          Imprimir
        </Button>
      </div>
    </div>
  );
};

export default Print;

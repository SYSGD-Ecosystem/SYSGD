import { type FC, useEffect, useState } from "react";
import WorkSpace from "../components/WorkSpace";
import Sidebar from "../components/Sidebar";
import HeadBar from "../components/HeadBar";
import NavBar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import useConnection from "../hooks/connection/useConnection";
import { ToastProvider } from "../hooks/useToast";

const App: FC = () => {
  const navigate = useNavigate();
  const { handleServerStatus } = useConnection();
  const [status, setStatus] = useState("");
  const [optionMainSelected, setOptionMainSelected] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    handleServerStatus(
      (mns) => {
        setStatus(mns);
      },
      (err) => {
        setStatus(err);
        return;
      }
    );
  }, []);

  if (status !== "200") {
    navigate("login");
    return;
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-full flex-col">
        <HeadBar />
        <div className="size-full flex overflow-auto">
          <NavBar />
          <Sidebar onOptionSelected={setOptionMainSelected} />

          <WorkSpace page={optionMainSelected} />
        </div>
      </div>
    </ToastProvider>
  );
};

export default App;

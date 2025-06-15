import { FC, useEffect, useState } from "react";
import MainContainer from "../components/MainContainer";
import Sidebar from "../components/Sidebar";
import HeadBar from "../components/HeadBar";
import NavBar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import useConnection from "../hooks/useConnection";

const App: FC = () => {
  const navigate = useNavigate();
  const { handleServerStatus } = useConnection();
  const [status, setStatus] = useState("");

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
    <div className="flex h-screen w-full flex-col">
      <HeadBar />
      <div className="size-full flex overflow-auto">
        <NavBar />
        <Sidebar />

        <MainContainer />
      </div>
    </div>
  );
};

export default App;

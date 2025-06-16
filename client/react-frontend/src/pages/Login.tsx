import React, { FC, useEffect, useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import Text, { Variant } from "../components/Text";
import { IoIosApps } from "react-icons/io";
import useConnection from "../hooks/connection/useConnection";
import { IoAlertCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const Login: FC = () => {
  const [server, setServer] = useState("");

  const [host, setHost] = useState("");
  const [databaseName, setDatabaseName] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  const { handleServerStatus, handleSqlLogin } = useConnection();
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    handleServerStatus(
      (mns) => {
        setStatus(mns);
      },
      (err) => {
        setStatus(err);
      }
    );
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleSqlLogin(
      host,
      user,
      password,
      databaseName,
      (mns) => {
        setStatus(mns);
      },
      (err) => {
        setStatus(err);
      }
    );
  };

  const handleServer = (_e: React.FormEvent) => {
    //e.preventDefault();
    localStorage.setItem("server", server);
    useEffect(() => {
      handleServerStatus(
        (mns) => {
          setStatus(mns);
        },
        (err) => {
          console.error(err);
          localStorage.removeItem("server");
          setStatus("100");
        }
      );
    }, []);
  };

  if (status === "200") {
    navigate("/");
    return;
  }

  return (
    <div className="flex items-center justify-center bg-slate-800 h-screen">
      {status === "100" ? (
        <form
          onSubmit={handleServer}
          className="text-neutral-800 py-6 relative overflow-hidden flex flex-col justify-around w-96 h-max border border-neutral-500 rounded-lg bg-neutral-50 p-3 px-6"
        >
          <div className="before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
            <span className="font-extrabold text-2xl text-violet-600">
              Conectar al servidor:
            </span>
            <p className="text-neutral-700">
              Este programa trabaja con un servidor PHP externo para la gestión
              de la base de datos, por favor, indique la URL de su servidor:
            </p>
          </div>
          <div className="flex gap-1">
            <div className="relative rounded-lg w-64 overflow-hidden before:absolute before:w-12 before:h-12 before:content[''] before:right-0 before:bg-violet-500 before:rounded-full before:blur-lg after:absolute after:z-10 after:w-20 after:h-20 after:content[''] after:bg-rose-300 after:right-12 after:top-3 after:rounded-full after:blur-lg">
              <input
                type="text"
                className="relative bg-transparent ring-0 outline-none border border-neutral-500 text-neutral-900 placeholder-violet-700 text-sm rounded-lg focus:ring-violet-500 placeholder-opacity-60 focus:border-violet-500 block w-full p-2.5 checked:bg-emerald-500"
                placeholder="URL..."
                onChange={(event) => {
                  setServer(event.target.value);
                }}
              />
            </div>
            <button
              disabled={server === ""}
              className="bg-violet-500 text-neutral-50 p-2 rounded-lg hover:bg-violet-400"
            >
              Conectar
            </button>
          </div>
        </form>
      ) : status === "404" ? (
        <div className="bg-white w-96 h-48 rounded-lg p-4 flex flex-col gap-2">
          <div className="flex gap-2 text-red-500 text-xl font-light items-center">
            <IoAlertCircle />
            <span>Servidor no disponible</span>
          </div>
          <div className="text-sm text-neutral-700 text-justify">
            <span>
              No hemos podido establecer conexión con el servidor en {" "}
              <span className="text-blue-500">{localStorage.server}</span>, por
              favor, verifique su conexión a internet e inténtelo de nuevo, si
              el problema persiste, contacte con el administrador de su sistema.
            </span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                handleServerStatus(
                  (mns) => {
                    setStatus(mns);
                  },
                  (err) => {
                    setStatus(err);
                  }
                );
              }}
              className="flex gap-2 items-center justify-center bg-red-600 text-white size-max p-2 rounded-lg"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="w-80 relative bg-white overflow-hidden h-max rounded px-2 py-4 flex items-center flex-col gap-2 shadow before:absolute before:w-32 before:h-20 before:right-2 before:bg-rose-300 before:-z-10 before:rounded-full before:blur-xl before:-top-12 z-10 after:absolute after:w-24 after:h-24 after:bg-purple-300 after:-z-10 after:rounded-full after:blur after:-top-12 after:-right-6">
          <div className="flex items-center flex-col justify-center">
            <div className="flex gap-1 w-max items-center justify-center">
              <div>
                <IoIosApps size={24} />
              </div>
              <Text label="SYSGD" variant={Variant.Heading} />
            </div>

            <Text
              label="Conectar con la base de datos"
              variant={Variant.Span}
            />
          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-2 items-center justify-center"
          >
            <Input onChange={setHost} label="Host: *" type="text" />
            <Input onChange={setUser} label="Usuario: *" type="text" />
            <Input onChange={setPassword} label="Contraseña:" type="password" />
            <Input
              onChange={setDatabaseName}
              label="Base de datos: *"
              type="text"
            />
            <Button
              isDisabled={host === "" || databaseName === "" || user === ""}
            >
              Connectar
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Login;

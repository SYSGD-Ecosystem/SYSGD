const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

type useConnectionReturnType = {
    handleNewArchiving: (
      code: string,
      company: string,
      name: string,
      onSuccess: () => void,
      onFail: () => void
    ) => Promise<void>;
    handleAddClassificationBoxData: (
      code: string,
      data: string,
      onSuccess: () => void,
      onFail: () => void
    ) => Promise<void>;
  };

const useConnection = (): useConnectionReturnType => {

  const handleNewArchiving = async (
    code: string,
    company: string,
    name: string,
    onSuccess: () => void,
    onFail: () => void
  ) => {
    try {
      const res = await fetch(`${serverUrl}/api/create_new_classification_box`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, company, name }),
      });
      if (res.ok) onSuccess();
      else {
        const text = await res.text();
        alert(text);
        onFail();
      }
    } catch {
      onFail();
    }
  };

  const handleAddClassificationBoxData = async (
  code: string,
  data: string,
  onSuccess: () => void,
  onFail: () => void
) => {
  try {
    const res = await fetch(`${serverUrl}/api/add_classification_data`, {
      method: "POST", // 👈 Cambiar PUT por POST
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, data }), // 👈 Enviar ambos en el body
    });

    if (res.ok) onSuccess();
    else {
      const text = await res.text();
      console.error(text)
      onFail();
    }
  } catch (e) {
    console.error("Error al guardar:", e);
    onFail();
  }
};


  return { handleNewArchiving, handleAddClassificationBoxData };
};

export default useConnection;

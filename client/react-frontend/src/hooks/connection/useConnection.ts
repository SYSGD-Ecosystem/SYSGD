type useConnectionReturnType = {
  handleServerStatus: (
    onSuccess: (message: string) => void,
    onFail: (message: string) => void
  ) => void;

  handleSqlLogin: (
    servername: string,
    username: string,
    password: string,
    dbname: string,
    onSuccess: (message: string) => void,
    onFail: (message: string) => void
  ) => void;

  handleNewArchiving: (
    code: string,
    company: string,
    name: string,
    onSuccess: () => void,
    onFail: () => void
  ) => void;

  handleAddClassificationBoxData: (
    code: string,
    data: string,
    onSuccess: () => void,
    onFail: () => void
  ) => void;
};

const useConnection = (): useConnectionReturnType => {
  const server = localStorage.getItem("server");

  const handleServerStatus = (
    onSuccess: (message: string) => void,
    onFail: (message: string) => void
  ) => {
    if (server === null) {
      onFail("100");
      return;
    }

    const req = new XMLHttpRequest();
    req.onload = () => {
      onSuccess(req.responseText);
    };

    req.onerror = () => {
      onFail("404");
    };

    req.open("GET", server + "/index.php");
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
  };

  const handleSqlLogin = (
    servername: string,
    username: string,
    password: string,
    dbname: string,
    onSuccess: (message: string) => void,
    onFail: (message: string) => void
  ) => {
    const form = new FormData();
    form.append("host", servername);
    form.append("db_name", dbname);
    form.append("user", username);
    form.append("pass", password);

    const req = new XMLHttpRequest();
    req.onload = () => {
      onSuccess(req.responseText);
    };

    req.onerror = () => {
      onFail("error");
    };

    req.open("POST", server + "/install.php");
    //req.setRequestHeader("Content-Type", "application/json");
    req.send(form);
  };

  const handleNewArchiving = (
    code: string,
    company: string,
    name: string,
    onSuccess: () => void,
    onFail: () => void
  ) => {
    const form = new FormData();
    form.append("code", code);
    form.append("company", company);
    form.append("name", name);
    form.append("action", "create_new_classification_box");

    const req = new XMLHttpRequest();
    req.onload = () => {
      if (req.responseText === "201") {
        onSuccess();
      } else {
        alert(req.responseText);
        onFail();
      }
    };

    req.onerror = () => {
      onFail();
    };

    req.open("POST", server + "/api.php");
    req.send(form);
  };

  const handleAddClassificationBoxData = (
    code: string,
    data: string,
    onSuccess: () => void,
    onFail: () => void
  ) => {
    const form = new FormData();
    form.append("code", code);
    form.append("data", data);
    form.append("action", "add_classification_data");

    const req = new XMLHttpRequest();
    req.onload = () => {
      if (req.responseText === "201") {
        onSuccess();
      } else {
        alert(req.responseText);
        onFail();
      }
    };

    req.onerror = () => {
      onFail();
    };

    req.open("POST", server + "/api.php");
    req.send(form);
  };

  return {
    handleServerStatus,
    handleSqlLogin,
    handleNewArchiving,
    handleAddClassificationBoxData,
  };
};

export default useConnection;

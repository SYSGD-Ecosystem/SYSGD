import { FC, useCallback, useEffect, useState } from "react";
import Button from "../components/Button";
import useGetData from "../hooks/connection/useGetData";
import Input from "../components/Input";

const DevPreview: FC = () => {
  const [textValue, setTextValue] = useState("");
  const { data } = useGetData(textValue === "" ? "0" : textValue);
  useEffect(() => {
    console.log(data);
  }, [textValue]);

  const test = useCallback(()=>{
    console.log("call")
  }, [textValue])

  return (
    <div className="bg-blue-500 h-screen flex items-center justify-center">
      <div className="bg-white size-96 rounded shadow p-2 flex flex-col gap-2 items-center justify-center">
        <span className="size-full overflow-auto">{JSON.stringify(data)}</span>
        <Input label="code" type="text" onChange={setTextValue} />
        <Button onClick={test}>Test</Button>
      </div>
    </div>
  );
};

export default DevPreview;

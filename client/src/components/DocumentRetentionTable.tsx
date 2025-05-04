import { FC } from "react";

export type DocumentRetentionTableData = {
  code: string;
  document: string;
};

export type DocumentRetentionTableProps = {
  data: DocumentRetentionTableData[];
  company: string;
  managementFile: string;
};

const DocumentRetentionTable: FC<DocumentRetentionTableProps> = ({
  data,
  company,
  managementFile,
}) => {
  return (
    <div className="size-full flex flex-col overflow-auto">
      <div className="w-full flex justify-center p-2 items-center">
        <div className="bg-white dark:bg-slate-900 py-5 px-10 border dark:border-slate-700 flex flex-col shadow min-w-[21.59cm] min-h-[27.54cm] rounded">
          <div id="content">
            <table
              id="myTable"
              className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
            >
              <thead className="">
                <tr>
                  <th colSpan={11} className="py-2">
                    <div className="flex">
                      <div className="w-full">ANEXO</div>
                      <div className="w-full text-right"> OT-RG 0801. A10</div>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th
                    colSpan={11}
                    className="text-center py-2 text-base uppercase"
                  >
                    <div>TABLA DE RETENCIÓN DOCUMENTAL</div>
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="text-left py-2 text-sm uppercase">
                    <div>
                      Entidad: <span className="font-normal">{company}</span>
                    </div>
                    <div>
                      Oficina Productora:{" "}
                      <span className="font-normal">{managementFile}</span>
                    </div>
                  </th>
                </tr>
                <TableHeading />
              </thead>
              <tbody>
                {data.map((props, index) => {
                  return (
                    <TableRow
                      code={props.code}
                      document={props.document}
                      key={index}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentRetentionTable;

const TableHeading: FC = () => {
  return (
    <>
      <tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
        <th className="p-2 border dark:border-gray-700" rowSpan={2}>
          Código
        </th>
        <th className="p-2 border dark:border-gray-700 w-full text-left" rowSpan={2}>
          Series y Subseries Documentales
        </th>
        <th className="p-2 border dark:border-gray-700 text-center" colSpan={2}>
          Valoracón
        </th>
        <th className="p-2 border dark:border-gray-700 text-center" colSpan={2}>
          Soporte
        </th>
        <th className="p-2 border dark:border-gray-700 text-center" colSpan={2}>
          Acceso
        </th>
        <th className="p-2 border dark:border-gray-700 text-center" colSpan={2}>
          Plazo de Retención
        </th>
        <th className="p-2 border dark:border-gray-700 text-center" rowSpan={2}>
          Observaciones
        </th>
      </tr>
      <tr className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-900 dark:text-gray-400">
        <Th label="T" />
        <Th label="P" />
        <Th label="P" />
        <Th label="D" />
        <Th label="L" />
        <Th label="R" />
        <Th label="AG" />
        <Th label="AC" />
      </tr>
    </>
  );
};

const TableRow: FC<{ code: string; document: string }> = ({
  code,
  document,
}) => {
  return (
    <tr className="">
      <Td label={code}/>
      <Td label={document}/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
      <Td label=""/>
    </tr>
  );
};

const Th: FC<{label:string}> = ({label}) =>{
  return <th className="p-2 border dark:border-gray-700 text-center">{label}</th>
}

const Td: FC<{label:string}> = ({label}) =>{
  return <td contentEditable className="p-2 border dark:border-gray-700">{label}</td>
}

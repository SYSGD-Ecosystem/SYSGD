import { FC } from "react";

export type ClassificationBoxTableData = {
  code: string;
  document: string;
};

export type ClassificationBoxTableProps = {
  data: ClassificationBoxTableData[];
  company: string;
  managementFile: string

};

const ClassificationBoxTable: FC<ClassificationBoxTableProps> = ({ data, company, managementFile }) => {
  return (
    <div className="w-full flex flex-col h-full overflow-auto">
      <div className="w-full flex justify-center p-2 items-center">
        <div className="bg-white py-5 px-10 border flex flex-col shadow min-w-[21.59cm] min-h-[27.54cm]">
          <div id="content">
            <table
              id="myTable"
              className="w-full text-sm text-left rtl:text-right text-gray-500"
            >
              <thead className="">
                <tr>
                  <th colSpan={2} className="py-2">
                    <div className="flex">
                      <div className="w-full">ANEXO</div>
                      <div className="w-full text-right"> OT-RG 0801. A9</div>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th
                    colSpan={2}
                    className="text-center py-2 text-base uppercase"
                  >
                    <div>Cuadro de Clasificación</div>
                    <div>{company}</div>
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="text-left py-2 text-sm uppercase">
                    <div>
                      Archivo de gestión:{" "}
                      <span className="font-normal">{managementFile}</span>
                    </div>
                    <div>Documentos generados</div>
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

export default ClassificationBoxTable;

const TableHeading: FC = () => {
  return (
    <tr className="text-xs text-gray-700 uppercase bg-gray-50">
      <th className="p-2 border">Código</th>
      <th className="p-2 border w-full text-left">
        Series y Subseries Documentales
      </th>
    </tr>
  );
};

const TableRow: FC<{ code: string; document: string }> = ({
  code,
  document,
}) => {
  return (
    <tr>
      <td className="p-2 border">{code}</td>
      <td className="p-2 border">{document}</td>
    </tr>
  );
};

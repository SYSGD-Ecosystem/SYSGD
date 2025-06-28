import type { Employee } from "../types/organigrama"

export const organizationData: Employee = {
  id: "1",
  name: "Ana María Rodríguez",
  position: "Directora",
  department: "Dirección General",
  email: "aalvarez@elecltu.une.cu",
  children: [
    {
      id: "2",
      name: "Miguel Torres",
      position: "Esp. A en Redes y Sistemas",
      department: "Tecnología",
      email: "mcasí@elecltu.une.cu",
    },
    {
      id: "3",
      name: "María Elena Vásquez",
      position: "Esp. B Gestión Económica",
      department: "Finanzas",
      email: "maria.vasquez@empresa.com",
    },
    {
      id: "4",
      name: "Fernando López",
      position: "Head of Sales",
      department: "Ventas",
      email: "fernando.lopez@empresa.com",
    },
  ],
}

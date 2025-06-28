import type { Employee } from "../types/organigrama"

export const organizationData: Employee = {
  id: "1",
  name: "Ana María Rodríguez",
  position: "CEO",
  department: "Dirección General",
  email: "ana.rodriguez@empresa.com",
  children: [
    {
      id: "2",
      name: "Carlos Mendoza",
      position: "CTO",
      department: "Tecnología",
      email: "carlos.mendoza@empresa.com",
      children: [
        {
          id: "5",
          name: "Laura García",
          position: "Lead Developer",
          department: "Desarrollo",
          email: "laura.garcia@empresa.com",
          children: [
            {
              id: "8",
              name: "Miguel Torres",
              position: "Frontend Developer",
              department: "Desarrollo",
              email: "miguel.torres@empresa.com",
            },
            {
              id: "9",
              name: "Sofia Herrera",
              position: "Backend Developer",
              department: "Desarrollo",
              email: "sofia.herrera@empresa.com",
            },
          ],
        },
        {
          id: "6",
          name: "Roberto Silva",
          position: "DevOps Engineer",
          department: "Infraestructura",
          email: "roberto.silva@empresa.com",
        },
      ],
    },
    {
      id: "3",
      name: "María Elena Vásquez",
      position: "CFO",
      department: "Finanzas",
      email: "maria.vasquez@empresa.com",
      children: [
        {
          id: "7",
          name: "Diego Morales",
          position: "Contador Senior",
          department: "Contabilidad",
          email: "diego.morales@empresa.com",
        },
      ],
    },
    {
      id: "4",
      name: "Fernando López",
      position: "Head of Sales",
      department: "Ventas",
      email: "fernando.lopez@empresa.com",
      children: [
        {
          id: "10",
          name: "Carmen Ruiz",
          position: "Sales Manager",
          department: "Ventas",
          email: "carmen.ruiz@empresa.com",
        },
        {
          id: "11",
          name: "Andrés Castillo",
          position: "Sales Representative",
          department: "Ventas",
          email: "andres.castillo@empresa.com",
        },
      ],
    },
  ],
}

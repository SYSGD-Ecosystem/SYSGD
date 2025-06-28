"use client"

import { EmployeeCard } from "./employee-card"
import type { Employee } from "../types/organigrama"

interface OrganigramaTreeProps {
  employee: Employee
  level?: number
}

export function OrganigramaTree({ employee, level = 0 }: OrganigramaTreeProps) {
  const hasChildren = employee.children && employee.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Empleado actual */}
      <div className="relative">
        <EmployeeCard employee={employee} level={level} />

        {/* Línea vertical hacia abajo */}
        {hasChildren && (
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-border top-full"></div>
        )}
      </div>

      {/* Hijos */}
      {hasChildren && (
        <div className="relative mt-8">
          {/* Línea horizontal */}
          {employee.children!.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-border transform -translate-y-4"></div>
          )}

          {/* Líneas verticales hacia cada hijo */}
          <div className="flex justify-center space-x-8 lg:space-x-12">
            {employee.children!.map((child, index) => (
              <div key={child.id} className="relative">
                {employee.children!.length > 1 && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-border -top-4"></div>
                )}
                <OrganigramaTree employee={child} level={level + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

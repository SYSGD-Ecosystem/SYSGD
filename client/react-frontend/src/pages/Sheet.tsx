"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Save,
  Plus,
  Minus,
  Upload,
  Undo,
  Redo,
  Copy,
  ClipboardPasteIcon as Paste,
  Trash2,
  Edit3,
  FileSpreadsheet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

interface CellData {
  value: string
  id: string
}

interface TableData {
  [key: string]: CellData[]
}

const EditableSpreadsheet = () => {
  const [tableData, setTableData] = useState<TableData>(() => {
    // Inicializar con datos por defecto
    const initialData: TableData = {}
    for (let i = 0; i < 10; i++) {
      const rowKey = `row-${i}`
      initialData[rowKey] = []
      for (let j = 0; j < 8; j++) {
        initialData[rowKey].push({
          id: `cell-${i}-${j}`,
          value: i === 0 ? `Columna ${j + 1}` : "",
        })
      }
    }
    return initialData
  })

  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [history, setHistory] = useState<TableData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [copiedCell, setCopiedCell] = useState<CellData | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  // Función para obtener las dimensiones de la tabla
  const getTableDimensions = useCallback(() => {
    const rowCount = Object.keys(tableData).length
    const colCount = tableData["row-0"]?.length || 0
    return { rowCount, colCount }
  }, [tableData])

  // Función para parsear el ID de celda
  const parseCellId = useCallback((cellId: string) => {
    const parts = cellId.split("-")
    return {
      row: Number.parseInt(parts[1]),
      col: Number.parseInt(parts[2]),
    }
  }, [])

  // Función para crear ID de celda
  const createCellId = useCallback((row: number, col: number) => {
    return `cell-${row}-${col}`
  }, [])

  // Función para navegar con flechas
  const navigateCell = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (!selectedCell) return

      const { row, col } = parseCellId(selectedCell)
      const { rowCount, colCount } = getTableDimensions()

      let newRow = row
      let newCol = col

      switch (direction) {
        case "up":
          newRow = Math.max(0, row - 1)
          break
        case "down":
          newRow = Math.min(rowCount - 1, row + 1)
          break
        case "left":
          newCol = Math.max(0, col - 1)
          break
        case "right":
          newCol = Math.min(colCount - 1, col + 1)
          break
      }

      const newCellId = createCellId(newRow, newCol)
      setSelectedCell(newCellId)

      // Scroll hacia la celda si es necesario
      const cellElement = document.getElementById(newCellId)
      if (cellElement) {
        cellElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
      }
    },
    [selectedCell, parseCellId, createCellId, getTableDimensions],
  )

  // Manejar eventos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo manejar flechas si no estamos editando
      if (editingCell) return

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault()
          navigateCell("up")
          break
        case "ArrowDown":
          e.preventDefault()
          navigateCell("down")
          break
        case "ArrowLeft":
          e.preventDefault()
          navigateCell("left")
          break
        case "ArrowRight":
          e.preventDefault()
          navigateCell("right")
          break
        case "Enter":
          if (selectedCell && !editingCell) {
            e.preventDefault()
            setEditingCell(selectedCell)
            setIsEditing(true)
            setTimeout(() => inputRef.current?.focus(), 0)
          }
          break
        case "Escape":
          if (editingCell) {
            setEditingCell(null)
            setIsEditing(false)
          }
          break
        case "Delete":
        case "Backspace":
          if (selectedCell && !editingCell) {
            e.preventDefault()
            const { row, col } = parseCellId(selectedCell)
            const rowKey = `row-${row}`
            updateCell(rowKey, col, "")
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedCell, editingCell, navigateCell, parseCellId])

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(tableData)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [tableData, history, historyIndex])

  const updateCell = (rowKey: string, cellIndex: number, value: string) => {
    setTableData((prev) => {
      const newData = { ...prev }
      if (newData[rowKey]) {
        newData[rowKey] = [...newData[rowKey]]
        newData[rowKey][cellIndex] = { ...newData[rowKey][cellIndex], value }
      }
      return newData
    })
  }

  const addRow = () => {
    saveToHistory()
    const rowCount = Object.keys(tableData).length
    const columnCount = tableData[`row-0`]?.length || 8
    const newRowKey = `row-${rowCount}`

    setTableData((prev) => ({
      ...prev,
      [newRowKey]: Array.from({ length: columnCount }, (_, index) => ({
        id: `cell-${rowCount}-${index}`,
        value: "",
      })),
    }))
  }

  const addColumn = () => {
    saveToHistory()
    setTableData((prev) => {
      const newData = { ...prev }
      Object.keys(newData).forEach((rowKey) => {
        const currentLength = newData[rowKey].length
        const rowIndex = Number.parseInt(rowKey.split("-")[1])
        newData[rowKey] = [
          ...newData[rowKey],
          {
            id: `cell-${rowIndex}-${currentLength}`,
            value: rowIndex === 0 ? `Columna ${currentLength + 1}` : "",
          },
        ]
      })
      return newData
    })
  }

  const removeRow = () => {
    const rowCount = Object.keys(tableData).length
    if (rowCount <= 1) return

    saveToHistory()
    const lastRowKey = `row-${rowCount - 1}`
    setTableData((prev) => {
      const newData = { ...prev }
      delete newData[lastRowKey]
      return newData
    })
  }

  const removeColumn = () => {
    const columnCount = tableData[`row-0`]?.length || 0
    if (columnCount <= 1) return

    saveToHistory()
    setTableData((prev) => {
      const newData = { ...prev }
      Object.keys(newData).forEach((rowKey) => {
        newData[rowKey] = newData[rowKey].slice(0, -1)
      })
      return newData
    })
  }

  const handleCellClick = (cellId: string, rowKey: string, cellIndex: number) => {
    setSelectedCell(cellId)
    if (isEditing) {
      setEditingCell(cellId)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleCellDoubleClick = (cellId: string) => {
    setEditingCell(cellId)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCellKeyDown = (e: React.KeyboardEvent, rowKey: string, cellIndex: number) => {
    if (e.key === "Enter") {
      const value = (e.target as HTMLInputElement).value
      updateCell(rowKey, cellIndex, value)
      setEditingCell(null)
      setIsEditing(false)

      // Mover a la siguiente fila después de Enter
      const { row } = parseCellId(selectedCell!)
      const { rowCount } = getTableDimensions()
      if (row < rowCount - 1) {
        const newCellId = createCellId(row + 1, cellIndex)
        setSelectedCell(newCellId)
      }
    } else if (e.key === "Escape") {
      setEditingCell(null)
      setIsEditing(false)
    } else if (e.key === "Tab") {
      e.preventDefault()
      const value = (e.target as HTMLInputElement).value
      updateCell(rowKey, cellIndex, value)
      setEditingCell(null)

      // Mover a la siguiente columna con Tab
      if (e.shiftKey) {
        navigateCell("left")
      } else {
        navigateCell("right")
      }
    }
  }

  const handleCellBlur = (rowKey: string, cellIndex: number) => {
    if (inputRef.current) {
      updateCell(rowKey, cellIndex, inputRef.current.value)
    }
    setEditingCell(null)
  }

  const saveSpreadsheet = () => {
    const dataStr = JSON.stringify(tableData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "spreadsheet.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Convertir datos de la tabla a formato de array
    const worksheetData: string[][] = []

    // Obtener las filas ordenadas
    const sortedRows = Object.keys(tableData).sort((a, b) => {
      const aIndex = Number.parseInt(a.split("-")[1])
      const bIndex = Number.parseInt(b.split("-")[1])
      return aIndex - bIndex
    })

    // Convertir cada fila
    sortedRows.forEach((rowKey) => {
      const rowData = tableData[rowKey].map((cell) => cell.value)
      worksheetData.push(rowData)
    })

    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Configurar ancho de columnas
    const colWidths = worksheetData[0]?.map(() => ({ wch: 15 })) || []
    worksheet["!cols"] = colWidths

    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hoja1")

    // Generar y descargar archivo
    const fileName = `spreadsheet_${new Date().toISOString().split("T")[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const copyCell = () => {
    if (selectedCell) {
      const [, rowIndex, cellIndex] = selectedCell.split("-")
      const rowKey = `row-${rowIndex}`
      const cell = tableData[rowKey]?.[Number.parseInt(cellIndex)]
      if (cell) {
        setCopiedCell(cell)
      }
    }
  }

  const pasteCell = () => {
    if (selectedCell && copiedCell) {
      const [, rowIndex, cellIndex] = selectedCell.split("-")
      const rowKey = `row-${rowIndex}`
      updateCell(rowKey, Number.parseInt(cellIndex), copiedCell.value)
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setTableData(history[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setTableData(history[historyIndex + 1])
    }
  }

  const clearTable = () => {
    saveToHistory()
    setTableData((prev) => {
      const newData = { ...prev }
      Object.keys(newData).forEach((rowKey) => {
        newData[rowKey] = newData[rowKey].map((cell, index) => ({
          ...cell,
          value: rowKey === "row-0" ? `Columna ${index + 1}` : "",
        }))
      })
      return newData
    })
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Barra de herramientas */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-2 flex-wrap shadow-sm">
        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <Button onClick={saveSpreadsheet} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-1" />
            Guardar JSON
          </Button>
          <Button
            onClick={exportToExcel}
            size="sm"
            variant="outline"
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Exportar Excel
          </Button>
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-1" />
            Cargar
          </Button>
          <Button onClick={() => setIsEditing(!isEditing)} size="sm" variant={isEditing ? "default" : "outline"}>
            <Edit3 className="w-4 h-4 mr-1" />
            {isEditing ? "Salir" : "Editar"}
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <Button onClick={undo} size="sm" variant="outline" disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={redo} size="sm" variant="outline" disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <Button onClick={copyCell} size="sm" variant="outline" disabled={!selectedCell}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button onClick={pasteCell} size="sm" variant="outline" disabled={!copiedCell || !selectedCell}>
            <Paste className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <Button onClick={addRow} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Fila
          </Button>
          <Button onClick={addColumn} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Columna
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
          <Button onClick={removeRow} size="sm" variant="outline">
            <Minus className="w-4 h-4 mr-1" />
            Fila
          </Button>
          <Button onClick={removeColumn} size="sm" variant="outline">
            <Minus className="w-4 h-4 mr-1" />
            Columna
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button onClick={clearTable} size="sm" variant="outline">
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      {/* Área de la tabla */}
      <div className="flex-1 overflow-auto p-4" ref={tableRef}>
        <div className="inline-block min-w-full">
          <table className="border-collapse border border-gray-300 bg-white shadow-sm">
            <tbody>
              {Object.keys(tableData)
                .sort((a, b) => {
                  const aIndex = Number.parseInt(a.split("-")[1])
                  const bIndex = Number.parseInt(b.split("-")[1])
                  return aIndex - bIndex
                })
                .map((rowKey, rowIndex) => (
                  <tr key={rowKey}>
                    {/* Número de fila */}
                    <td className="w-12 h-8 bg-gray-100 border border-gray-300 text-center text-sm font-medium text-gray-600">
                      {rowIndex + 1}
                    </td>
                    {tableData[rowKey].map((cell, cellIndex) => (
                      <td
                        key={cell.id}
                        id={cell.id}
                        className={cn(
                          "border border-gray-300 p-0 relative min-w-[100px] h-8 cursor-pointer",
                          selectedCell === cell.id && "ring-2 ring-blue-500 ring-inset bg-blue-50",
                          rowIndex === 0 && "bg-gray-50 font-medium",
                        )}
                        onClick={() => handleCellClick(cell.id, rowKey, cellIndex)}
                        onDoubleClick={() => handleCellDoubleClick(cell.id)}
                      >
                        {editingCell === cell.id ? (
                          <Input
                            ref={inputRef}
                            defaultValue={cell.value}
                            className="w-full h-full border-0 rounded-none focus:ring-0 focus:border-0 p-1 text-sm"
                            onKeyDown={(e) => handleCellKeyDown(e, rowKey, cellIndex)}
                            onBlur={() => handleCellBlur(rowKey, cellIndex)}
                          />
                        ) : (
                          <div className="w-full h-full p-1 text-sm flex items-center min-h-[32px]">
                            {cell.value || (isEditing && selectedCell === cell.id ? "Haz clic para editar" : "")}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de estado */}
      <div className="bg-white border-t border-gray-200 p-2 text-sm text-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Filas: {Object.keys(tableData).length}</span>
          <span>Columnas: {tableData["row-0"]?.length || 0}</span>
          {selectedCell && <span>Celda seleccionada: {selectedCell}</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            Usa las flechas ↑↓←→ para navegar • Enter para editar • Tab para siguiente celda
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", isEditing ? "bg-green-500" : "bg-gray-400")} />
            <span>{isEditing ? "Modo edición" : "Solo lectura"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditableSpreadsheet

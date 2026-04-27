import type { KeyboardEvent } from "react";

/**
 * Keyboard navigation for a grid of inputs.
 *
 * Inputs must have a data attribute that encodes their position:
 *   data-cell="rowIndex-colIndex"
 *
 * Supported keys:
 *   ArrowUp / ArrowDown  → move row
 *   ArrowLeft / ArrowRight → move column (only when at boundary of text)
 *   Tab / Shift+Tab      → move column (always)
 *   Enter                → move down one row
 */

const focusCell = (container: HTMLElement, row: number, col: number) => {
  const target = container.querySelector<HTMLInputElement>(
    `input[data-cell="${row}-${col}"]`,
  );
  if (target) {
    target.focus();
    // Put cursor at end
    const len = target.value.length;
    target.setSelectionRange(len, len);
  }
};

export const useGridNavigation = (containerRef: React.RefObject<HTMLElement>) => {
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    row: number,
    col: number,
    totalRows: number,
    totalCols: number,
  ) => {
    const container = containerRef.current;
    if (!container) return;

    const input = e.currentTarget;
    const { selectionStart, selectionEnd, value } = input;
    const atStart = selectionStart === 0 && selectionEnd === 0;
    const atEnd = selectionStart === value.length && selectionEnd === value.length;

    switch (e.key) {
      case "ArrowUp":
        if (row > 0) {
          e.preventDefault();
          focusCell(container, row - 1, col);
        }
        break;

      case "ArrowDown":
      case "Enter":
        if (row < totalRows - 1) {
          e.preventDefault();
          focusCell(container, row + 1, col);
        }
        break;

      case "ArrowLeft":
        if (atStart && col > 0) {
          e.preventDefault();
          focusCell(container, row, col - 1);
        }
        break;

      case "ArrowRight":
        if (atEnd && col < totalCols - 1) {
          e.preventDefault();
          focusCell(container, row, col + 1);
        }
        break;

      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          if (col > 0) focusCell(container, row, col - 1);
          else if (row > 0) focusCell(container, row - 1, totalCols - 1);
        } else {
          if (col < totalCols - 1) focusCell(container, row, col + 1);
          else if (row < totalRows - 1) focusCell(container, row + 1, 0);
        }
        break;
    }
  };

  return { handleKeyDown };
};

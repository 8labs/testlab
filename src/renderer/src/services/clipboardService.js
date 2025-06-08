/**
 * Service for handling clipboard operations in the test table
 */

/**
 * Get the value of a cell based on its type (input or result)
 * @param {Object} row - The row containing the cell
 * @param {number} colIndex - The column index
 * @param {boolean} isInput - Whether this is an input cell
 * @returns {string} The cell value
 */
export const getCellValue = (row, colIndex, isInput) => {
    if (!row) return "";

    if (isInput) {
        return row.inputItems[colIndex]?.value || "";
    } else {
        const item = row.resultItems[colIndex];
        return item ? `${item.operator}${item.value}` : "";
    }
};

/**
 * Set the value of a cell based on its type
 * @param {Object} row - The row containing the cell
 * @param {number} colIndex - The column index
 * @param {string} value - The value to set
 * @param {boolean} isInput - Whether this is an input cell
 * @param {Function} updateCallback - Callback to trigger after update
 */
export const setCellValue = (row, colIndex, value, isInput, updateCallback) => {
    if (!row) return;

    if (isInput) {
        if (!row.inputItems[colIndex]) {
            row.inputItems[colIndex] = { value: "" };
        }
        row.inputItems[colIndex].value = value;
    } else {
        if (!row.resultItems[colIndex]) {
            row.resultItems[colIndex] = { value: "", operator: "=" };
        }
        const match = value.match(/^([=!<>]+)(.*)$/);
        if (match) {
            row.resultItems[colIndex].operator = match[1];
            row.resultItems[colIndex].value = match[2];
        } else {
            row.resultItems[colIndex].value = value;
        }
    }
    updateCallback();
};

/**
 * Handle copying selected cells to clipboard
 * @param {Array} selectedCells - Array of selected cell keys
 * @param {Object} testTable - The test table object
 * @returns {Object} Clipboard data object
 */
export const handleCopy = (selectedCells, testTable) => {
    if (selectedCells.length === 0) return null;

    const sortedCells = [...selectedCells].sort((a, b) => {
        const [rowA, colA, typeA] = a.split("-");
        const [rowB, colB, typeB] = b.split("-");
        if (rowA !== rowB) return parseInt(rowA) - parseInt(rowB);
        if (typeA !== typeB) return typeA === "input" ? -1 : 1;
        return parseInt(colA) - parseInt(colB);
    });

    const values = sortedCells.map((cellKey) => {
        const [row, col, type] = cellKey.split("-");
        return getCellValue(testTable.rows[parseInt(row)], parseInt(col), type === "input");
    });

    const firstCell = sortedCells[0].split("-");
    const lastCell = sortedCells[sortedCells.length - 1].split("-");

    const inputCols = testTable.inputColumns.length;
    const resultCols = testTable.resultColumns.length;

    const getAbsoluteCol = (col, type) => {
        return type === "input" ? parseInt(col) : parseInt(col) + inputCols;
    };

    const firstCol = getAbsoluteCol(firstCell[1], firstCell[2]);
    const lastCol = getAbsoluteCol(lastCell[1], lastCell[2]);
    const numCols = lastCol - firstCol + 1;
    const numRows = parseInt(lastCell[0]) - parseInt(firstCell[0]) + 1;

    const valueGrid = [];
    for (let r = 0; r < numRows; r++) {
        const row = [];
        for (let c = 0; c < numCols; c++) {
            const index = r * numCols + c;
            row.push(values[index]);
        }
        valueGrid.push(row);
    }

    const clipboardData = {
        values: valueGrid,
        isMultiCell: true,
        dimensions: {
            rows: numRows,
            cols: numCols,
        },
    };

    // Copy to system clipboard
    navigator.clipboard.writeText(values.join("\t"));

    return clipboardData;
};

/**
 * Handle pasting clipboard data into selected cells
 * @param {Array} selectedCells - Array of selected cell keys
 * @param {Object} testTable - The test table object
 * @param {Object} clipboardData - The clipboard data to paste
 * @param {Function} updateCallback - Callback to trigger after update
 */
export const handlePaste = (selectedCells, testTable, clipboardData, updateCallback) => {
    if (selectedCells.length === 0 || !clipboardData) return;

    const targetCell = selectedCells[0];
    const [startRow, startCol, startType] = targetCell
        .split("-")
        .map((val, i) => (i === 2 ? val : parseInt(val)));

    if (clipboardData.isMultiCell) {
        const { values, dimensions } = clipboardData;
        let currentRow = startRow;
        let isInput = startType === "input";

        for (let r = 0; r < dimensions.rows; r++) {
            if (currentRow >= testTable.rows.length) break;

            let currentCol = startCol;
            let currentType = isInput;

            for (let c = 0; c < dimensions.cols; c++) {
                const maxCol = currentType
                    ? testTable.inputColumns.length
                    : testTable.resultColumns.length;

                if (currentCol >= maxCol) {
                    if (currentType) {
                        currentType = false;
                        currentCol = 0;
                    } else {
                        currentRow++;
                        currentType = isInput;
                        currentCol = startCol;
                        if (currentRow >= testTable.rows.length) break;
                    }
                }

                setCellValue(
                    testTable.rows[currentRow],
                    currentCol,
                    values[r][c],
                    currentType,
                    updateCallback
                );
                currentCol++;
            }

            currentRow++;
        }
    } else {
        const value = clipboardData.values[0][0];
        selectedCells.forEach((cellKey) => {
            const [row, col, type] = cellKey.split("-");
            setCellValue(
                testTable.rows[parseInt(row)],
                parseInt(col),
                value,
                type === "input",
                updateCallback
            );
        });
    }
}; 
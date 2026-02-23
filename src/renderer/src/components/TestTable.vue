<template>
  <div class="decisionable-table" v-if="!!testTable">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <td class="fix"></td>
            <td
              v-for="(column, colIndex) in testTable.inputColumns"
              v-bind:key="column.id || colIndex"
              class="condition"
            >
              <div @click="handleColumnClick(column, true)">
                <h5>Input</h5>
                <span>{{ column.label }}</span>
              </div>
              <img
                @click="addCondition()"
                class="header-add"
                src="../assets/img/header-add.svg"
                v-if="testTable.inputColumns.length - 1 == colIndex"
              />
              <div class="fieldEditPopup" v-show="column.editVisible">
                <div>
                  <label>Column title</label>
                  <input
                    type="text"
                    v-model="column.label"
                    placeholder="Edit me"
                    @blur="updateColumn(column, true)"
                  />
                </div>
                <div>
                  <label>Column expression</label>
                  <input
                    type="text"
                    v-model="column.expression"
                    placeholder="Edit me"
                    @blur="updateColumn(column, true)"
                  />
                </div>
                <div>
                  <a @click="removeColumn(column, true)"
                    ><img src="../assets/img/trash.svg" /> Remove column</a
                  >
                </div>
              </div>
            </td>
            <td
              v-for="(column, colIndex) in testTable.resultColumns"
              v-bind:key="column.id || colIndex"
              class="result"
            >
              <div @click="handleColumnClick(column, false)">
                <h5>Expected Result</h5>
                <span>{{ column.label }}</span>
              </div>
              <img
                @click="addResult()"
                class="header-add"
                src="../assets/img/header-add.svg"
                v-if="testTable.resultColumns.length - 1 == colIndex"
              />
              <div class="fieldEditPopup" v-show="column.editVisible">
                <div>
                  <label>Column title</label>
                  <input
                    type="text"
                    v-model="column.label"
                    placeholder="Edit me"
                    @blur="updateColumn(column, false)"
                  />
                </div>
                <div>
                  <label>Column expression</label>
                  <input
                    type="text"
                    v-model="column.expression"
                    placeholder="Edit me"
                    @blur="updateColumn(column, false)"
                  />
                </div>
                <div>
                  <a @click="removeColumn(column, false)"
                    ><img src="../assets/img/trash.svg" /> Remove column</a
                  >
                </div>
              </div>
            </td>
            <td></td>
            <td class="no-border fix"></td>
            <td class="no-border fix"></td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in orderedRows()"
            v-bind:key="row.id || rowIndex"
          >
            <td class="index-cell fix">
              <span class="delete-row" @click="removeRow(row)"
                ><img src="../assets/img/trash.svg"
              /></span>
              {{ rowIndex + 1 }}
            </td>
            <td
              v-for="(inputItem, inputItemIndex) in row.inputItems"
              class="condition"
              v-bind:key="inputItem.id || inputItemIndex"
              :class="{
                selected: isCellSelected(rowIndex, inputItemIndex, true),
              }"
              @click="(e) => handleCellClick(e, rowIndex, inputItemIndex, true)"
            >
              <input
                @change="updateData()"
                @focus="focusedItem = inputItem"
                type="text"
                v-model="inputItem.value"
                placeholder="Input Value"
                @paste.prevent
              />
            </td>
            <td
              v-for="(outputItem, outputItemIndex) in row.resultItems"
              v-bind:key="outputItem.id || outputItemIndex"
              class="result"
              :class="{
                selected: isCellSelected(rowIndex, outputItemIndex, false),
              }"
              @click="
                (e) => handleCellClick(e, rowIndex, outputItemIndex, false)
              "
            >
              <div>
                <select v-model="outputItem.operator" @change="updateData()">
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </select>
                <input
                  @change="updateData()"
                  type="text"
                  v-model="outputItem.value"
                  placeholder="Expected Value"
                  @paste.prevent
                />
              </div>
            </td>
            <td></td>
            <td class="fix">
              <img
                src="../assets/img/playblue.svg"
                tooltip="Run Test"
                @click="executeSingleTest(row, rowIndex)"
                style="cursor: pointer"
              />
            </td>
            <td class="fix" :class="{ 'historical-test': !lastRunThisSession }">
              <div></div>
              <img
                src="../assets/img/checkmark-transparent.svg"
                v-if="testResults[rowIndex] == undefined && !testsRunning"
              />
              <img
                src="../assets/img/loading-blocks.svg"
                v-if="testResults[rowIndex] == undefined && testsRunning"
              />
              <img
                src="../assets/img/checkmark.svg"
                v-if="
                  !!testResults[rowIndex] && testResults[rowIndex].match == true
                "
                @click="
                  $emit('testSelected', {
                    row: row,
                    test: testResults[rowIndex],
                    testTable: testTable,
                  })
                "
              />
              <img
                src="../assets/img/exclamation.svg"
                v-if="
                  !!testResults[rowIndex] &&
                  testResults[rowIndex].match == false
                "
                @click="
                  $emit('testSelected', {
                    row: row,
                    test: testResults[rowIndex],
                    testTable: testTable,
                  })
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <div @click="addRow()">+</div>
      <div class="filler"></div>

      <div>
        <p
          class="last-run"
          v-if="(!!testHistory && !!testHistory.date) || !!lastRunThisSession"
        >
          Last run
          {{
            !!lastRunThisSession
              ? formatDate(lastRunThisSession)
              : formatDate(testHistory.date)
          }}
        </p>
      </div>

      <div
        class="failure-count"
        :colspan="
          testTable.inputColumns.length + testTable.resultColumns.length + 2
        "
      >
        <div
          v-if="
            !testsRunning &&
            !!testHistory &&
            !!testResults &&
            testResults.length > 0
          "
        >
          <img
            src="../assets/img/exclamation.svg"
            v-if="!!testHistory && testHistory.failureCount > 0"
          />{{ testResults.length - testHistory.failureCount }} of
          {{ testResults.length }} passing
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { handleCopy, handlePaste } from "../services/clipboardService";

const props = defineProps({
  testTable: {
    type: Object,
    required: true,
  },
  testResults: {
    type: Object,
    default: () => ({}),
  },
  testHistory: {
    type: Object,
    default: () => ({}),
  },
  testsRunning: {
    type: Boolean,
    default: false,
  },
  lastRunThisSession: {
    type: Date,
    default: null,
  },
});

const emit = defineEmits([
  "columnAdded",
  "columnRemoved",
  "columnUpdated",
  "rowAdded",
  "rowRemoved",
  "dataUpdated",
  "testExecuted",
  "allTestsExecuted",
  "testSelected",
]);

const focusedItem = ref(null);
const selectedCells = ref([]);
const lastSelectedCell = ref(null);
const clipboard = ref({
  values: [],
  isMultiCell: false,
});

const formatDate = (dateToFormat) => {
  if (!dateToFormat) return "";
  const dateObj = new Date(dateToFormat);
  return dateObj.toISOString().split("T")[0];
};

function labelToKey(label) {
  let key = label
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_");

  return /^[a-z_]/.test(key) ? key : "_" + key;
}

const orderedRows = () => {
  if (props.testTable.rows) {
    return props.testTable.rows;
  } else {
    return undefined;
  }
};

// Column operations
const addCondition = () => {
  const newColumn = {
    label: "New Input",
    expression: "",
    editVisible: false,
  };

  props.testTable.inputColumns.push(newColumn);

  // Initialize empty values for all rows
  for (let row of props.testTable.rows) {
    if (!row.inputItems) {
      row.inputItems = [];
    }
    row.inputItems.push({
      value: "",
    });
  }

  emit("columnAdded", { column: newColumn, isInput: true });
};

const addResult = () => {
  const newColumn = {
    label: "New Expected Result",
    expression: "",
    editVisible: false,
  };

  props.testTable.resultColumns.push(newColumn);

  // Initialize empty values for all rows
  for (let row of props.testTable.rows) {
    if (!row.resultItems) {
      row.resultItems = [];
    }
    row.resultItems.push({
      value: "",
      operator: "=",
    });
  }

  emit("columnAdded", { column: newColumn, isInput: false });
};

const updateColumn = (column, isInput) => {
  column.editVisible = false;
  column.key = labelToKey(column.label);
  emit("columnUpdated", { column, isInput });
};

const removeColumn = (column, isInput) => {
  const columnIndex = isInput
    ? props.testTable.inputColumns.findIndex((col) => col === column)
    : props.testTable.resultColumns.findIndex((col) => col === column);

  if (columnIndex === -1) return;

  if (isInput) {
    props.testTable.inputColumns.splice(columnIndex, 1);
  } else {
    props.testTable.resultColumns.splice(columnIndex, 1);
  }

  for (let row of props.testTable.rows) {
    if (isInput) {
      row.inputItems.splice(columnIndex, 1);
    } else {
      row.resultItems.splice(columnIndex, 1);
    }
  }

  emit("columnRemoved", { column, isInput, index: columnIndex });
};

// Row operations
const addRow = () => {
  const newRow = {
    inputItems: [],
    resultItems: [],
  };

  for (let column of props.testTable.inputColumns) {
    newRow.inputItems.push({
      value: "",
    });
  }

  for (let column of props.testTable.resultColumns) {
    newRow.resultItems.push({
      value: "",
      operator: "=",
    });
  }

  props.testTable.rows.push(newRow);
  emit("rowAdded", newRow);
};

const removeRow = (row) => {
  const index = props.testTable.rows.findIndex((r) => r.id === row.id);
  if (index !== -1) {
    props.testTable.rows.splice(index, 1);
    emit("rowRemoved", { row, index });
  }
};

// Data operations
const updateData = () => {
  emit("dataUpdated", props.testTable);
};

// Test execution
const executeSingleTest = (row, rowIndex) => {
  emit("testExecuted", { row, rowIndex });
};

// Cell selection and clipboard operations
const handleCellClick = (event, rowIndex, colIndex, isInput = true) => {
  const cellKey = `${rowIndex}-${colIndex}-${isInput ? "input" : "result"}`;

  if (event.ctrlKey || event.metaKey) {
    const index = selectedCells.value.indexOf(cellKey);
    if (index === -1) {
      selectedCells.value.push(cellKey);
    } else {
      selectedCells.value.splice(index, 1);
    }
  } else if (event.shiftKey && lastSelectedCell.value) {
    const [lastRow, lastCol, lastType] = lastSelectedCell.value.split("-");
    const lastRowNum = parseInt(lastRow);
    const lastColNum = parseInt(lastCol);

    const startRow = Math.min(lastRowNum, rowIndex);
    const endRow = Math.max(lastRowNum, rowIndex);
    const startCol = Math.min(lastColNum, colIndex);
    const endCol = Math.max(lastColNum, colIndex);

    selectedCells.value = [];

    if (
      lastColNum === colIndex &&
      lastType === (isInput ? "input" : "result")
    ) {
      for (let r = startRow; r <= endRow; r++) {
        selectedCells.value.push(
          `${r}-${colIndex}-${isInput ? "input" : "result"}`
        );
      }
    } else {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (c < props.testTable.inputColumns.length) {
            selectedCells.value.push(`${r}-${c}-input`);
          }
        }
        for (let c = startCol; c <= endCol; c++) {
          if (c < props.testTable.resultColumns.length) {
            selectedCells.value.push(`${r}-${c}-result`);
          }
        }
      }
    }
  } else {
    selectedCells.value = [cellKey];
  }

  lastSelectedCell.value = cellKey;
};

const isCellSelected = (rowIndex, colIndex, isInput) => {
  const cellKey = `${rowIndex}-${colIndex}-${isInput ? "input" : "result"}`;
  return selectedCells.value.includes(cellKey);
};

// Add click outside handler
const handleClickOutside = (event) => {
  const popups = document.querySelectorAll(".fieldEditPopup");
  popups.forEach((popup) => {
    if (!popup.contains(event.target) && !event.target.closest("td > div")) {
      const column =
        props.testTable.inputColumns.find((col) => col.editVisible) ||
        props.testTable.resultColumns.find((col) => col.editVisible);
      if (column) {
        updateColumn(column, props.testTable.inputColumns.includes(column));
      }
    }
  });
};

// Add function to close all popups
const closeAllPopups = () => {
  props.testTable.inputColumns.forEach((col) => (col.editVisible = false));
  props.testTable.resultColumns.forEach((col) => (col.editVisible = false));
};

// Modify the click handler in the template
const handleColumnClick = (column, isInput) => {
  closeAllPopups();
  column.editVisible = true;
};

onMounted(() => {
  window.addEventListener("keydown", (event) => {
    // Only handle copy/paste if cells are selected or table is focused
    if (event.target.closest(".decisionable-table")) {
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        const clipboardData = handleCopy(selectedCells.value, props.testTable);
        if (clipboardData) {
          clipboard.value = clipboardData;
        }
      } else if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        handlePaste(
          selectedCells.value,
          props.testTable,
          clipboard.value,
          updateData
        );
      }
    }
  });
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleCopy);
  window.removeEventListener("keydown", handlePaste);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* Base table styles */
.decisionable-table {
  min-width: 100%;
  position: relative;
}

.table-wrapper {
  min-width: 100%;
  overflow-x: auto;
  margin-right: 7rem; /* Space for fixed columns */
}

.decisionable-table table {
  min-width: 100%;
  font-family: "Nunito", sans-serif;
  font-weight: 300;
  background-color: #001d27;
  padding: 0;
  border: 1px solid #001d27;
  border-spacing: 0;
  table-layout: fixed;
}

/* Table cell base styles */
.decisionable-table td {
  position: relative;
  margin: 0;
  width: 7rem;
  background-color: #ffffff;
}

.decisionable-table td.result {
  width: 8.5rem;
}
.decisionable-table thead td {
  background-color: #001d27;
}

.decisionable-table td:nth-last-child(3) {
  width: auto;
  border-left: 3px double #00bfd3;
  border-right: none;
}

/* Fixed column styles */
.decisionable-table td.fix {
  position: sticky;
  background-color: inherit;
  z-index: 4999;
}

.decisionable-table td.fix:first-child {
  left: 0;
  width: 1.5rem;
}

.decisionable-table td.fix:nth-last-child(2) {
  right: 2.75rem;
  width: 2.75rem;
  text-align: center;
  padding: 0.5rem 0;
  border-left: 3px double #00bfd3;
}

.decisionable-table td.fix:last-child {
  right: 0;
  width: 2.75rem;
  text-align: center;
  padding: 0.5rem 0;
}

/* Ensure fixed columns have proper background */
.decisionable-table thead td.fix {
  background-color: #001d27;
}

.decisionable-table tbody td.fix {
  background-color: white;
}

/* Header styles */
.decisionable-table thead td {
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-right: 1px solid #00bfd3;
}

.decisionable-table thead td > div.header {
  top: -1.25rem;
  bottom: 0;
  position: absolute;
  left: 0;
  right: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.decisionable-table thead td h5 {
  color: #fff;
  font-weight: 300;
  font-size: 0.75rem;
}

.decisionable-table thead td span {
  color: #fff;
  width: 100%;
  font-weight: 300;
  font-family: "Inter";
  font-size: 0.85rem;
}

/* Body styles */
.decisionable-table tbody {
  color: #001d27;
  background-color: white;
}

.decisionable-table tbody td {
  border-right: 1px solid #00bfd3;
  border-bottom: 1px solid #001d27;
}

/* Input styles */
.decisionable-table input[type="text"] {
  border: none;
  width: 100%;
  font-weight: 300;
  font-family: "Inter";
  padding: 0.5rem 1rem;
}

.decisionable-table input[type="text"]:focus {
  outline: none;
}

.decisionable-table input[type="text"]::placeholder {
  color: #c0c0c0;
}

.decisionable-table thead input[type="text"] {
  background-color: #001d27;
  color: white;
}

.decisionable-table tbody input[type="text"] {
  color: #001d27;
}

/* Result cell styles */
.decisionable-table tbody td.result div {
  display: flex;
}

.decisionable-table tbody td.result select {
  min-width: 1.5rem;
  width: 1.5rem;
  border: none;
  color: #001d27;
  font-size: 0.85rem;
  font-weight: 300;
  font-family: "Inter";
  padding: 0.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-size: 1rem;
  padding-right: 0;
}

.decisionable-table tbody td.result select:focus {
  outline: none;
}

/* Special cell styles */
.decisionable-table td.index-cell {
  width: 6rem;
}

.decisionable-table td.no-border {
  border-right: none;
}

.decisionable-table td:last-child {
  border-right: none;
  padding: 0.5rem 1rem;
}

.decisionable-table td:first-child {
  padding: 0.5rem;
  width: 4rem;
  border-left: 3px single #001d27;
}

.decisionable-table td:nth-last-child(2) {
  padding: 0.5rem 1rem;
}

.decisionable-table tr:last-child td {
  border-bottom: none;
}

/* Row styles */
.decisionable-table tr .condition:not(:has(~ .condition)) {
  border-right: 3px double #00bfd3;
}

.decisionable-table tr .result:not(:has(~ .result)) {
  border-right: none;
}

.decisionable-table tr.lastrow td {
  background: #001d27;
  color: #ffffff;
  cursor: pointer;
  border: none;
  padding: 0.5rem 1rem;
}

/* Delete row button styles */
.decisionable-table td .delete-row {
  display: none;
  cursor: pointer;
  opacity: 0.7;
  margin-right: 5px;
}

.decisionable-table td:hover .delete-row {
  display: inline-block;
}

.decisionable-table .delete-row:hover {
  opacity: 1;
}

/* Header add button styles */
.decisionable-table .header-add {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translate(50%, -50%);
  z-index: 5000;
}

/* Field edit popup styles */
.fieldEditPopup {
  position: fixed;
  background: #001d27;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  width: 15rem;
}

.fieldEditPopup div {
  margin-bottom: 1rem;
}

.fieldEditPopup label {
  display: block;
  margin-bottom: 3px;
  font-size: 0.8rem;
}

.fieldEditPopup input {
  width: 100%;
  padding: 4px;
  border: 1px solid #00bfd3 !important;
}

.fieldEditPopup button {
  background: #00bfd3;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.fieldEditPopup a {
  font-size: 0.8rem;
}

/* Footer styles */
.table-footer {
  background-color: #001d27;
  color: #ffffff;
  width: 100%;
  padding: 0rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-footer div:first-child {
  cursor: pointer;
}

.table-footer div:last-child {
  display: flex;
  gap: 0.5rem;
}

.table-footer .filler {
  flex: 1;
}

.table-footer .last-run {
  font-size: 0.8rem;
}

/* Status and count styles */
.decisionable-table td.failure-count {
  text-align: right;
}

.decisionable-table td.failure-count img {
  margin-right: 0.75rem;
}

.decisionable-table td img {
  position: relative;
  top: 0.15rem;
  height: 1rem;
  margin: 0 0.25rem;
}

td.historical-test img {
  opacity: 0.25;
}

/* Selection styles */
.decisionable-table td.selected {
  background-color: rgba(0, 191, 211, 0.1);
}

.decisionable-table td.selected input {
  background-color: rgba(0, 191, 211, 0);
}

.decisionable-table td.selected select {
  background-color: rgba(0, 191, 211, 0);
}

/* Last run text */
.last-run {
  margin: 1rem 1rem;
}

/* Ensure images in fixed columns are properly sized and centered */
.decisionable-table td.fix img {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  margin: 0;
  position: static;
}

/* Remove any existing image positioning */
.decisionable-table td.fix img {
  top: auto;
  margin: 0;
}

/* Ensure the play button and status icons are properly sized */
.decisionable-table td.fix img[src*="playblue.svg"],
.decisionable-table td.fix img[src*="checkmark.svg"],
.decisionable-table td.fix img[src*="exclamation.svg"],
.decisionable-table td.fix img[src*="checkmark-transparent.svg"],
.decisionable-table td.fix img[src*="loading-blocks.svg"] {
  width: 1rem;
  height: 1rem;
  margin: 0;
  position: static;
}
</style>

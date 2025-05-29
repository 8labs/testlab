<template>
  <div v-cloak v-if="!!scenarioTable">
    <div class="mask" v-if="!!selectedTest"></div>
    <TestDetail
      :selectedTest="selectedTest"
      v-if="!!selectedTest"
      @close="closeTestDetail"
    />
    <div class="names">
      <input
        type="text"
        v-model="scenarioTable.name"
        @blur="updateMetadata()"
        placeholder="Test Scenario Name"
      />
    </div>
    <div class="address-bar">
      <select v-model="scenarioTable.method" @change="updateMetadata()">
        <option value="POST">POST</option>
        <option value="GET">GET</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
      <input
        type="text"
        v-model="scenarioTable.endpoint"
        @blur="updateMetadata()"
        placeholder="Test Scenario Endpoint"
      />

      <button @click="execute()">
        <img src="../assets/img/playwhite.svg" /> <span>Run All Tests</span>
      </button>
      <!-- <button @click="save()">Save Scenarios</button> -->
    </div>
    <div class="tab-bar">
      <button
        @click="tabView = 'table'"
        :class="{ active: tabView == 'table' }"
      >
        Table
      </button>
      <button
        @click="tabView = 'headers'"
        :class="{ active: tabView == 'headers' }"
      >
        Headers
      </button>
      <button @click="tabView = 'auth'" :class="{ active: tabView == 'auth' }">
        Authentication
      </button>
    </div>
    <div class="headers" v-if="tabView == 'headers'">
      <table>
        <thead>
          <tr>
            <td>Key</td>
            <td>Value</td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(header, headerIndex) in scenarioTable.testTable.headers"
            v-bind:key="header.id || headerIndex"
          >
            <td>
              <input type="text" v-model="header.key" @change="saveAll()" />
            </td>
            <td>
              <input type="text" v-model="header.value" @change="saveAll()" />
            </td>
          </tr>
          <tr class="lastrow" @click="addHeaderRow()">
            <td colspan="2">+</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="auth" v-if="tabView == 'auth'">
      <div class="auth-type">
        <label>Authentication Type</label>
        <select
          v-model="scenarioTable.testTable.authentication.type"
          @change="saveAll()"
        >
          <option value="">None</option>
          <option value="Basic">Basic</option>
          <option value="Token">Token</option>
        </select>
      </div>

      <div
        v-if="scenarioTable.testTable.authentication?.type === 'Basic'"
        class="auth-fields"
      >
        <div class="auth-field">
          <label>Username</label>
          <input
            type="text"
            v-model="scenarioTable.testTable.authentication.username"
            @change="saveAll()"
            placeholder="Username or {{variable}}"
            data-lpignore="true"
          />
        </div>
        <div class="auth-field">
          <label>Password</label>
          <div class="password-input-container">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="scenarioTable.testTable.authentication.password"
              @change="saveAll()"
              placeholder="Password or {{variable}}"
              data-lpignore="true"
            />
            <button
              class="password-toggle"
              @click="showPassword = !showPassword"
              type="button"
            >
              <img
                :src="
                  showPassword
                    ? '../assets/img/eye-off.svg'
                    : '../assets/img/eye.svg'
                "
                alt="Toggle password visibility"
              />
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="scenarioTable.testTable.authentication?.type === 'Token'"
        class="auth-fields"
      >
        <div class="auth-field">
          <label>Token</label>
          <input
            type="text"
            v-model="scenarioTable.testTable.authentication.token"
            @change="saveAll()"
            placeholder="Bearer token or {{variable}}"
          />
        </div>
      </div>
    </div>
    <div
      class="decisionable-table"
      v-if="!!scenarioTable && !!scenarioTable.testTable && tabView == 'table'"
    >
      <table>
        <thead>
          <tr>
            <td></td>
            <td
              v-for="(column, colIndex) in scenarioTable.testTable.inputColumns"
              v-bind:key="column.id || colIndex"
              class="condition"
            >
              <div @click="column.editVisible = !column.editVisible">
                <h5>Input</h5>
                <span>{{ column.label }}</span>
              </div>
              <img
                @click="addCondition()"
                class="header-add"
                src="../assets/img/header-add.svg"
                v-if="
                  scenarioTable.testTable.inputColumns.length - 1 == colIndex
                "
              />
              <div class="fieldEditPopup" v-show="column.editVisible">
                <div>
                  <label>Column title</label>
                  <input
                    type="text"
                    v-model="column.label"
                    placeholder="Edit me"
                  />
                </div>
                <div>
                  <label>Column expression</label>
                  <input
                    type="text"
                    v-model="column.expression"
                    placeholder="Edit me"
                  />
                </div>
                <div>
                  <a @click="removeColumn(column, true)">Remove column</a>
                  <button @click="updateColumn(column, true)">Update</button>
                </div>
              </div>
            </td>
            <td
              v-for="(column, colIndex) in scenarioTable.testTable
                .resultColumns"
              v-bind:key="column.id || colIndex"
              class="result"
            >
              <div @click="column.editVisible = !column.editVisible">
                <h5>Expected Result</h5>
                <span>{{ column.label }}</span>
              </div>
              <img
                @click="addResult()"
                class="header-add"
                src="../assets/img/header-add.svg"
                v-if="
                  scenarioTable.testTable.resultColumns.length - 1 == colIndex
                "
              />
              <div class="fieldEditPopup" v-show="column.editVisible">
                <div>
                  <label>Column title</label>
                  <input
                    type="text"
                    v-model="column.label"
                    placeholder="Edit me"
                  />
                </div>
                <div>
                  <label>Column expression</label>
                  <input
                    type="text"
                    v-model="column.expression"
                    placeholder="Edit me"
                  />
                </div>
                <button @click="updateColumn(column, false)">Update</button>
              </div>
            </td>

            <td class="no-border"></td>
            <td class="no-border"></td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in orderedRows()"
            v-bind:key="row.id || rowIndex"
          >
            <td class="index-cell">
              <span class="delete-row" @click="removeRow(row)"
                ><img src="../assets/img/trash.svg"
              /></span>
              {{ rowIndex + 1 }}
            </td>
            <td
              v-for="(inputItem, inputItemIndex) in row.inputItems"
              class="condition"
              v-bind:key="inputItem.id || inputItemIndex"
            >
              <input
                @change="saveAll()"
                @focus="focusedItem = inputItem"
                type="text"
                v-model="inputItem.value"
                placeholder="Input Value"
              />
            </td>
            <td
              v-for="(outputItem, outputItemIndex) in row.resultItems"
              v-bind:key="outputItem.id || outputItemIndex"
              class="result"
            >
              <div>
                <select v-model="outputItem.operator" @change="saveAll()">
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </select>
                <input
                  @change="saveAll()"
                  type="text"
                  v-model="outputItem.value"
                  placeholder="Expected Value"
                />
              </div>
            </td>
            <td style="width: 1rem">
              <img
                src="../assets/img/playblue.svg"
                tooltip="Run Test"
                @click="executeSingleTest(row, rowIndex)"
                style="cursor: pointer"
              />
            </td>
            <td style="width: 3.75rem">
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
                  selectedTest = {
                    row: row,
                    test: testResults[rowIndex],
                    testTable: scenarioTable.testTable,
                  }
                "
              />
              <img
                src="../assets/img/exclamation.svg"
                v-if="
                  !!testResults[rowIndex] &&
                  testResults[rowIndex].match == false
                "
                @click="
                  selectedTest = {
                    row: row,
                    test: testResults[rowIndex],
                    testTable: scenarioTable.testTable,
                  }
                "
              />
            </td>
          </tr>
          <tr class="lastrow" @click="addRow()">
            <td>+</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import TestDetail from "../components/TestDetail.vue";

import { ref, onMounted, watch, toRaw } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import { executeTest, executeAllTests } from "../services/testExecutor";

import {
  getAllTestScenarios,
  getTestScenario,
  saveTestScenario,
  updateTestScenarioMetadata,
} from "../services/dataService";

const jsonTable = ref({});
const scenarioTable = ref({});
const testResults = ref({});
const tableId = ref(null);

const focusedItem = ref(null);

const testsRunning = ref(false);

const tabView = ref("table");

const selectedTest = ref(null);
const showPassword = ref(false);

const emit = defineEmits(["namechanged", "scenarioresults"]);

const route = useRoute();
const router = useRouter();

const closeTestDetail = () => {
  selectedTest.value = null;
};

// const getAuthHeaders = () => {
//   return {
//     headers: {
//       Authorization: 'Bearer ' + token.value,
//     },
//   }
// }

function labelToKey(label) {
  let key = label
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_");

  return /^[a-z_]/.test(key) ? key : "_" + key;
}

const orderedRows = () => {
  if (scenarioTable.value.testTable.rows) {
    return scenarioTable.value.testTable.rows;
  } else {
    return undefined;
  }
};

// Update metadata (name and endpoint)
const updateMetadata = async () => {
  try {
    await updateTestScenarioMetadata(tableId.value, {
      name: scenarioTable.value.name,
      endpoint: scenarioTable.value.endpoint,
      method: scenarioTable.value.method,
    });
    emit("namechanged", scenarioTable.value.name);
  } catch (error) {
    console.error("Error updating metadata:", error);
  }
};

const addHeaderRow = async () => {
  if (!scenarioTable.value.testTable.headers) {
    scenarioTable.value.testTable.headers = [];
  }

  scenarioTable.value.testTable.headers.push({
    key: "new_header",
    value: "",
  });
};

// Update column
const updateColumn = async (column, isInput) => {
  column.editVisible = false;
  column.key = labelToKey(column.label);

  try {
    await saveTestScenario(toRaw(scenarioTable.value));
  } catch (error) {
    console.error("Error updating column:", error);
  }
};

const removeColumn = async (column, isInput) => {
  // Find the index of the column in its respective array
  const columnIndex = isInput
    ? scenarioTable.value.testTable.inputColumns.findIndex(
        (col) => col === column
      )
    : scenarioTable.value.testTable.resultColumns.findIndex(
        (col) => col === column
      );

  if (columnIndex === -1) return;

  // Remove the column from the columns array
  if (isInput) {
    scenarioTable.value.testTable.inputColumns.splice(columnIndex, 1);
  } else {
    scenarioTable.value.testTable.resultColumns.splice(columnIndex, 1);
  }

  // Remove the corresponding items from each row
  for (let row of scenarioTable.value.testTable.rows) {
    if (isInput) {
      row.inputItems.splice(columnIndex, 1);
    } else {
      row.resultItems.splice(columnIndex, 1);
    }
  }

  try {
    await saveTestScenario(toRaw(scenarioTable.value));
  } catch (error) {
    console.error("Error updating column:", error);
  }
};

// Add a result column
const addResult = async () => {
  const newColumn = {
    label: "New Expected Result",
    expression: "",
    editVisible: false,
  };

  scenarioTable.value.testTable.resultColumns.push(newColumn);

  // Initialize empty values for all rows
  for (let row of scenarioTable.value.testTable.rows) {
    if (!row.resultItems) {
      row.resultItems = [];
    }
    row.resultItems.push({
      value: "",
    });
  }
};

// Add a condition column
const addCondition = async () => {
  const newColumn = {
    label: "New Input",
    expression: "",
  };

  // Add column to UI with the ID from the server

  newColumn.editVisible = false;
  scenarioTable.value.testTable.inputColumns.push(newColumn);

  // Initialize empty values for all rows
  for (let row of scenarioTable.value.testTable.rows) {
    if (!row.inputItems) {
      row.inputItems = [];
    }
    row.inputItems.push({
      value: "",
    });
  }
};

// Add a new row
const addRow = async () => {
  // Create a new row with the ID from the server
  const newRow = {
    inputItems: [],
    resultItems: [],
  };

  // Initialize empty items for each column
  for (let column of scenarioTable.value.testTable.inputColumns) {
    newRow.inputItems.push({
      value: "",
    });
  }

  for (let column of scenarioTable.value.testTable.resultColumns) {
    newRow.resultItems.push({
      value: "",
      operator: "=",
    });
  }

  scenarioTable.value.testTable.rows.push(newRow);
};

// Remove a row
const removeRow = async (row) => {
  if (!row.id || !tableId.value) return;

  // Remove from UI
  const index = scenarioTable.value.testTable.rows.findIndex(
    (r) => r.id === row.id
  );
  if (index !== -1) {
    scenarioTable.value.testTable.rows.splice(index, 1);
  }
};

// Update a row item value
const saveAll = async () => {
  if (!tableId.value) return;

  try {
    await saveTestScenario(toRaw(scenarioTable.value));
  } catch (error) {
    console.error("Error saving scenario:", error);
  }
};

const execute = () => {
  runtests();
};

const runtests = () => {
  tabView.value = "table";
  testsRunning.value = true;
  testResults.value = [];

  for (let row of scenarioTable.value.testTable.rows) {
    executeSingleTest(row, scenarioTable.value.testTable.rows.indexOf(row));
  }

  // executeAllTests(toRaw(scenarioTable.value))
  //   .then((results) => {
  //     testResults.value = results
  //     emit('scenarioresults', results)
  //     testsRunning.value = false
  //   })
  //   .catch((error) => {
  //     console.error('Error executing tests:', error)
  //     testsRunning.value = false
  //   })
};

const executeSingleTest = async (row, rowIndex) => {
  testsRunning.value = true;
  testResults.value[rowIndex] = undefined;

  try {
    const result = await executeTest(toRaw(scenarioTable.value), toRaw(row));
    testResults.value[rowIndex] = result;
    testsRunning.value = false;

    // If the test failed, show the test detail
    // if (!result.match) {
    //   selectedTest.value = {
    //     row: row,
    //     test: result,
    //     testTable: scenarioTable.value.testTable
    //   }
    // }
  } catch (error) {
    console.error("Error executing single test:", error);
    testsRunning.value = false;
  }
};

const loadTestScenario = async () => {
  tableId.value = route.params["id"];
  testResults.value = [];

  if (tableId.value === "new") {
    let newTable = {
      name: "New Test Scenario " + new Date().toISOString(),
      endpoint: "",
      method: "POST",
      testTable: {
        headers: [{ key: "new_header", value: "" }],
        inputColumns: [
          { key: "new_input", label: "New Input", expression: "" },
        ],
        resultColumns: [
          {
            key: "new_expected_result",
            label: "New Expected Result",
            expression: "",
          },
        ],
        rows: [{ inputItems: [{ value: "" }], resultItems: [{ value: "" }] }],
      },
    };

    try {
      const saved = await saveTestScenario(newTable);
      scenarioTable.value = saved;
      emit("namechanged", scenarioTable.value.name);
      router
        .push({ name: "TestScenarios", params: { id: saved.id } })
        .then(() => {
          // router.go(0)
        });
    } catch (error) {
      console.error("Error creating new scenario:", error);
    }
  } else if (tableId.value && tableId.value !== "new") {
    try {
      const scenario = await getTestScenario(tableId.value);
      if (scenario) {
        scenarioTable.value = scenario;
        if (!scenarioTable.value.testTable.authentication) {
          scenarioTable.value.testTable.authentication = {};
        }

        if (
          !scenarioTable.value.testTable.headers ||
          scenarioTable.value.testTable.headers.length == 0
        ) {
          scenarioTable.value.testTable.headers = [
            { key: "new_header", value: "" },
          ];
        }
      }
    } catch (error) {
      console.error("Error loading scenario:", error);
    }
  }
};

watch(
  () => route.params.id,
  async (newId) => {
    loadTestScenario();
  }
);

onMounted(async () => {
  loadTestScenario();
});
</script>

<style scoped>
.mask {
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  position: fixed;
  top: 2rem;
  left: 18rem;
  width: 100%;
  height: 100%;
}

.decision-table {
  min-width: 100%;
}
table {
  min-width: 100%;
}

thead td > div.header {
  top: -1.25rem;
  bottom: 0;
  position: absolute;
  left: 0;
  right: 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.names {
  margin-top: 1.5rem;
}

.names input {
  border: none;
  width: 100%;
  padding: 0.5rem 0;
  font-size: 1rem;
}

.names input:focus {
  outline: none;
}

.address-bar {
  display: flex;
  width: 100%;
  background-color: #001d27;
  color: #ffffff;
  margin: 1.5rem 0;
}

.address-bar select {
  background-color: #001d27;
  color: #00bfd3;
  font-size: 1rem;
  border-radius: 0;
  border: none;
  padding: 0 0 0 1rem;
}

.address-bar input {
  border: none;
  background-color: #001d27;
  color: #ffffff;
  flex-grow: 1;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.address-bar input::placeholder {
  color: #00bfd3;
  border: none;
}

.address-bar input:focus {
  outline: none;
}

.address-bar button {
  background-color: #00bfd3;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 0;
  width: fit-content;
  cursor: pointer;
}

.address-bar button span {
  font-size: 0.75rem;
  line-height: 1.25rem;
}

.address-bar button img {
  width: 0.75rem;
  margin-right: 0.25rem;
  padding-top: 0.25rem;
}

.decisionable-table tr.lastrow td {
  background: #001d27;
  color: #ffffff;
  cursor: pointer;
}

td.index-cell {
  width: 6rem;
}

td .delete-row {
  display: none;
}

td:hover .delete-row {
  display: inline-block;
}

.delete-row {
  cursor: pointer;
  opacity: 0.7;
  margin-right: 5px;
}

.delete-row:hover {
  opacity: 1;
}

.fieldEditPopup {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.fieldEditPopup div {
  margin-bottom: 8px;
}

.fieldEditPopup label {
  display: block;
  margin-bottom: 3px;
  font-size: 0.8rem;
}

.fieldEditPopup input {
  width: 100%;
  padding: 4px;
  border: 1px solid #ccc;
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

.decisionable-table table {
  font-family: "Nunito", sans-serif;
  font-weight: 300;
  background-color: #001d27;
  padding: 0;
  border: 1px solid #001d27;
  border-spacing: 0;
}

.decisionable-table input[type="text"]:focus {
  outline: none;
}

.decisionable-table input[type="text"] {
  border: none;
  width: 100%;
  font-weight: 300;
  font-family: "Inter";
}

.decisionable-table thead td span {
  color: #fff;
  width: 100%;
  font-weight: 300;
  font-family: "Inter";
  font-size: 0.85rem;
}

.decisionable-table thead input[type="text"] {
  background-color: #001d27;
  color: white;
}

.decisionable-table thead {
}
.decisionable-table tbody {
  border-radius: 0 0 0.5rem 0.5rem;
  color: #001d27;
}

.decisionable-table thead {
}

.decisionable-table thead td {
  cursor: pointer;
}

.decisionable-table thead th {
  padding: 0.5rem 1rem;
  color: white;
  font-weight: 300;
  padding: 2rem 1rem 0.5rem 1rem;
  text-align: left;
  border-right: 1px solid #00bfd3;
}

input[type="text"]::placeholder {
  color: #c0c0c0;
}

.decisionable-table thead td h5 {
  color: #fff;
  font-weight: 300;
  font-size: 0.75rem;
}

.decisionable-table .header-add {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translate(50%, -50%);
  z-index: 5000;
}

.decisionable-table thead th:first-child {
  border-radius: 0.5rem 0 0 0;
}

.decisionable-table thead th:last-child {
  border-right: none;

  border-radius: 0 0.5rem 0 0;
}

.decisionable-table td {
  position: relative;
}

.decisionable-table tbody {
  background-color: white;
  border-radius: 0.5rem;
}

.decisionable-table tbody input[type="text"] {
  color: #001d27;
}

.decisionable-table tfoot {
  color: #001d27;
  background-color: white;
  border-radius: 0.5rem;
}

.decisionable-table td {
  padding: 0.5rem 1rem;
  margin: 0;
}

.decisionable-table tbody td {
  border-right: 1px solid #00bfd3;
  border-bottom: 1px solid #001d27;
}

.decisionable-table thead td {
  border-right: 1px solid #00bfd3;
}

.decisionable-table td.no-border {
  border-right: none;
}

.decisionable-table td:last-child {
  border-right: none;
}

.decisionable-table tr:last-child td {
  border-bottom: none;
}

.decisionable-table tbody td.result div {
  display: flex;
}

.decisionable-table tbody td.result select {
  width: 2rem;
  border: none;
  color: #001d27;
  font-size: 0.85rem;
  font-weight: 300;
  font-family: "Inter";
  padding: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-size: 1rem;
  padding-right: 1rem;
}

.decisionable-table tbody td.result select:focus {
  outline: none;
}

.decisionable-table td.result {
}

.decisionable-table td img {
  position: relative;
  top: 0.15rem;
  height: 1rem;
  margin: 0 0.25rem;
}

.decisionable-table tr .condition:not(:has(~ .condition)) {
  border-right: 3px double #00bfd3;
}

.decisionable-table tbody:not(:has(~ tfoot)) tr:last-child td:last-child {
  border-bottom-right-radius: 0.5rem;
}
.decisionable-table tbody:not(:has(~ tfoot)) tr:last-child td:first-child {
  border-bottom-left-radius: 0.5rem;
}

.decisionable-table tfoot tr:last-child td:last-child {
  border-bottom-right-radius: 0.5rem;
}
.decisionable-table tfoot tr:last-child td:first-child {
  border-bottom-left-radius: 0.5rem;
}

.decisionable-table tfoot td {
  border-top: 3px double #001d27;
}

.fieldEditPopup {
  padding: 1rem;
  background: #00bfd3;
  border-radius: 0.5rem;
  color: white;
  position: absolute;
  transform: translate(-50%, 100%);
  bottom: -1rem;
  left: 50%;
  width: 20rem;
  z-index: 10000;
}

.fieldEditPopup div {
  margin-bottom: 1rem;
}

.fieldEditPopup button {
  background: white;
  color: #00bfd3;
  float: right;
}

.fieldEditPopup input[type="text"] {
  padding: 0.5rem;
  background: #00bfd3 !important;
  color: white;
  border: 1px solid white;
  border-radius: 0.5rem;
}

.tab-bar {
}

.tab-bar button {
  background-color: #fff;
  color: #001d27;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 0;
  margin-bottom: 1rem;
  cursor: pointer;
}

.tab-bar button.active {
  border-bottom: 3px solid #00bfd3;
}

.headers table {
  width: 100%;
  border-collapse: collapse;
}

.headers table thead td {
  padding: 1rem 1rem;
  border-right: none;
}

.headers table td {
  border-right: 1px solid #00bfd3;
  border-bottom: 1px solid #001d27;
  padding: 0.5rem 0rem;
}

.headers table td:last-child {
  border-right: none;
}

.headers table tr.lastrow td {
  background: #001d27;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.headers table input[type="text"] {
  padding: 0.5rem 1rem;
  width: 100%;
  border: none;
  color: #001d27;
}

.auth {
  padding: 1rem;
}

.auth-type {
  margin-bottom: 1.5rem;
}

.auth-type label {
  display: block;
  margin-bottom: 0.5rem;
  color: #001d27;
  font-weight: 500;
}

.auth-type select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #001d27;
  color: #001d27;
  font-size: 1rem;
}

.auth-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-field label {
  color: #001d27;
  font-weight: 500;
}

.auth-field input {
  padding: 0.5rem;
  border: 1px solid #001d27;
  font-size: 1rem;
}

.auth-field input:focus {
  outline: none;
  border-color: #001d27;
}

.auth-field input::placeholder {
  color: #c0c0c0;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  flex-grow: 1;
  padding-right: 2.5rem;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle img {
  width: 1.25rem;
  height: 1.25rem;
  opacity: 0.7;
}

.password-toggle:hover img {
  opacity: 1;
}
</style>
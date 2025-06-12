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
    </div>
    <div
      class="followup-bar"
      v-if="
        !scenarioTable.followup_endpoint &&
        scenarioTable.followup_endpoint != ''
      "
    >
      <a @click="addFollowup()">Add a followup endpoint</a>
    </div>
    <div
      class="address-bar"
      v-if="
        !!scenarioTable.followup_endpoint ||
        scenarioTable.followup_endpoint == ''
      "
    >
      <select
        v-model="scenarioTable.followup_method"
        @change="updateMetadata()"
      >
        <option value="POST">POST</option>
        <option value="GET">GET</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
      <input
        type="text"
        class="address-bar-input"
        v-model="scenarioTable.followup_endpoint"
        @blur="updateMetadata()"
        placeholder="Followup Endpoint"
      />
      <div class="followup-bar-options">
        <span>Delay</span>
        <input type="number" v-model="scenarioTable.followup_wait_time" />
        <select v-model="scenarioTable.followup_wait_time_unit">
          <option value="ms">ms</option>
          <option value="s">s</option>
        </select>
      </div>

      <button @click="removeFollowup()">x</button>
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
    <TestTable
      v-if="tabView == 'table'"
      :testTable="scenarioTable.testTable"
      :testResults="testResults"
      :testHistory="testHistory"
      :testsRunning="testsRunning"
      :lastRunThisSession="lastRunThisSession"
      @columnAdded="handleColumnAdded"
      @columnRemoved="handleColumnRemoved"
      @columnUpdated="handleColumnUpdated"
      @rowAdded="handleRowAdded"
      @rowRemoved="handleRowRemoved"
      @dataUpdated="handleDataUpdated"
      @testExecuted="handleTestExecuted"
      @testSelected="handleTestSelected"
    />
  </div>
</template>

<script setup>
import TestDetail from "../components/TestDetail.vue";
import TestTable from "../components/TestTable.vue";

import { ref, onMounted, watch, toRaw } from "vue";
import { useRoute, useRouter } from "vue-router";
import { executeTest, executeAllTests } from "../services/testExecutor";
import {
  saveTestHistory,
  getTestHistory,
} from "../services/testHistoryService";

import {
  getAllTestScenarios,
  getTestScenario,
  createNewTestScenario,
  saveTestScenario,
  updateTestScenarioMetadata,
} from "../services/dataService";

const jsonTable = ref({});
const scenarioTable = ref({});
const testResults = ref({});
const tableId = ref(null);
const testsRunning = ref(false);
const tabView = ref("table");
const selectedTest = ref(null);
const showPassword = ref(false);
const lastRunThisSession = ref(null);
const testHistory = ref([]);

const emit = defineEmits([
  "namechanged",
  "scenarioresults",
  "testHistorySaved",
]);

const route = useRoute();
const router = useRouter();

const closeTestDetail = () => {
  selectedTest.value = null;
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

const addFollowup = () => {
  scenarioTable.value.followup_endpoint = "";
  scenarioTable.value.followup_method = "POST";
  scenarioTable.value.followup_wait_time = 1000;
  scenarioTable.value.followup_wait_time_unit = "ms";
};

const removeFollowup = () => {
  scenarioTable.value.followup_endpoint = null;
};

// Update metadata (name and endpoint)
const updateMetadata = async () => {
  try {
    await updateTestScenarioMetadata(tableId.value, {
      name: scenarioTable.value.name,
      endpoint: scenarioTable.value.endpoint,
      method: scenarioTable.value.method,
      followup_endpoint: scenarioTable.value.followup_endpoint,
      followup_method: scenarioTable.value.followup_method,
    });
    emit("namechanged", scenarioTable.value.name);
  } catch (error) {
    console.error("Error updating metadata:", error);
  }
};

const saveScenario = async () => {
  try {
    await saveTestScenario(toRaw(scenarioTable.value));
  } catch (error) {
    console.error("Error saving scenario:", error);
  }
};

// Table event handlers
const handleColumnAdded = async ({ column, isInput }) => {
  await saveScenario();
};

const handleColumnRemoved = async ({ column, isInput, index }) => {
  await saveScenario();
};

const handleColumnUpdated = async ({ column, isInput }) => {
  await saveScenario();
};

const handleRowAdded = async (row) => {
  await saveScenario();
};

const handleRowRemoved = async ({ row, index }) => {
  await saveScenario();
};

const handleDataUpdated = async (testTable) => {
  await saveScenario();
};

const handleTestExecuted = async ({ row, rowIndex }) => {
  testsRunning.value = true;
  testResults.value[rowIndex] = undefined;

  try {
    const result = await executeTest(toRaw(scenarioTable.value), row);
    testResults.value[rowIndex] = result;
    testsRunning.value = false;
  } catch (error) {
    console.error("Error executing single test:", error);
    testsRunning.value = false;
  }
};

const handleTestSelected = (testData) => {
  selectedTest.value = testData;
};

const execute = () => {
  runtests();
};

const runtests = async () => {
  tabView.value = "table";
  testsRunning.value = true;
  testResults.value = [];

  window.eightlabs.trackEvent("tests_executed", {
    row_count: scenarioTable.value.testTable.rows.length,
  });

  const results = [];
  for (let row of scenarioTable.value.testTable.rows) {
    const result = await executeTest(toRaw(scenarioTable.value), toRaw(row));
    results.push(result);
  }

  try {
    await saveTestHistory({
      id: scenarioTable.value.id,
      date: new Date().toISOString(),
      failureCount: results.filter((result) => !result.match).length,
      results: results,
    });
    loadTestHistory();
    lastRunThisSession.value = new Date();
    emit("testHistorySaved");
  } catch (error) {
    console.error("Error saving test history:", error);
  }

  testsRunning.value = false;
};

const loadTestScenario = async () => {
  tableId.value = route.params["id"];
  testResults.value = [];

  const id = tableId.value !== "new" ? tableId.value : null;

  try {
    let scenario = await getTestScenario(id);
    if (scenario) {
      if (tableId.value === "new") {
        scenario = await createNewTestScenario();
        router.push({ name: "TestScenarios", params: { id: scenario.id } });
      }
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
};

const loadTestHistory = async () => {
  testHistory.value = {};
  testResults.value = [];

  if (tableId.value && tableId.value !== "new") {
    try {
      const testHistories = await getTestHistory(tableId.value);
      if (testHistories && testHistories.length > 0) {
        testHistory.value = testHistories[0];
        testResults.value = testHistory.value.results;
      } else {
        testHistory.value = {};
      }
    } catch (error) {
      console.error("Error loading test history:", error);
    }
  }
};

watch(
  () => route.params.id,
  async (newId) => {
    lastRunThisSession.value = false;
    tableId.value = newId;
    await loadTestScenario();
    await loadTestHistory();
  }
);

onMounted(async () => {
  await loadTestScenario();
  await loadTestHistory();
});
</script>

<style scoped>
/* Mask overlay */
.mask {
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  position: fixed;
  top: 2rem;
  left: 18rem;
  width: 100%;
  height: 100%;
}

/* Name input styles */
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

/* Address bar styles */
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
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.address-bar input[type="text"] {
  flex-grow: 1;
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

/* Tab bar styles */
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

/* Headers table styles */
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
}

.headers table input[type="text"] {
  padding: 0.5rem 1rem;
  width: 100%;
  border: none;
  color: #001d27;
}

/* Authentication styles */
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

/* Password input styles */
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

.followup-bar {
  margin-top: -1rem;
  margin-bottom: 1rem;
}

.followup-bar a {
  margin-left: 0.5rem;
  text-decoration: underline;
  color: #001d27;
  cursor: pointer;
  font-size: 0.85rem;
}

.followup-bar-options span {
  font-size: 0.85rem;
}

.followup-bar-options input {
  width: 5rem;
}

.followup-bar-options select {
  width: 4rem;
}
</style>
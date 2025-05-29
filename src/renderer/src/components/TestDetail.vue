<template>
  <div class="test-detail">
    <div class="close-button" @click="close">
      <img src="../assets/img/close.svg" />
    </div>
    <h3>HTTP Status</h3>
    <p>{{ selectedTest.test.httpStatus }}</p>
    <h3>Items</h3>
    <table>
      <thead>
        <tr>
          <td>Binding</td>
          <td>Return Value</td>
          <td>Operator</td>
          <td>Expected Value</td>
        </tr>
      </thead>
      <tr
        v-for="(inputItem, inputItemIndex) in selectedTest.row.resultItems"
        :key="inputItemIndex"
      >
        <td>
          {{ selectedTest.testTable.resultColumns[inputItemIndex].expression }}
        </td>
        <td
          v-if="
            selectedTest.testTable.resultColumns[inputItemIndex].expression
              .replace(' ', '')
              .toLowerCase() === '{{http_status}}'
          "
        >
          {{ selectedTest.test.httpStatus }}
        </td>
        <td v-else>
          {{ getPropertyValue(inputItemIndex) }}
        </td>
        <td>{{ inputItem.operator || "=" }}</td>
        <td>{{ inputItem.value }}</td>
      </tr>
    </table>

    <h3>Response Content</h3>
    <div
      class="json-content"
      v-if="
        !!selectedTest && !!selectedTest.test && !!selectedTest.test.jsonContent
      "
    >
      <vue-json-pretty
        :highlightSelectedNode="false"
        :showLine="false"
        theme="dark"
        :showSelectController="false"
        :data="selectedTest.test.jsonContent"
      />
    </div>
  </div>
</template>
  
<script setup>
import { ref, onMounted, computed } from "vue";

import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

const props = defineProps({
  selectedTest: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};

const getPropertyValue = (index) => {
  if (
    !props.selectedTest?.test?.jsonContent ||
    !props.selectedTest?.testTable?.resultColumns?.[index]?.expression
  ) {
    return "";
  }

  const expression =
    props.selectedTest.testTable.resultColumns[index].expression;
  if (!expression.startsWith("$.")) {
    return "";
  }

  // Remove the leading '$.' and split the path
  const json_path = expression.substring(2).split(".");

  // Start from the root object
  let current = props.selectedTest.test.jsonContent;

  // Traverse the path
  for (const key of json_path) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return "";
    }
    current = current[key];
  }

  // Return the final value, or empty string if undefined/null
  return current ?? "";
};

onMounted(async () => {});
</script>
  
<style scoped>
.close-button {
  position: fixed;
  top: 2rem;
  right: 1rem;
  padding: 1rem;
  cursor: pointer;
}

.test-detail {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: fit-content;
  background-color: #001d27;
  color: #ffffff;
  z-index: 10000;
  padding: 1rem 2rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-color: #00bfd3 #00000030;
}

h3 {
  margin-top: 2rem;
}

.test-detail a {
  color: #00bfd3;
}

table {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  border-collapse: collapse;
}

td {
  border: solid 1px #ffffff;
  padding: 0.5rem;
}

td.invalid {
  color: #ff0000;
}

.json-content .vjs-tree {
  border: solid 1px #ffffff;
  padding: 1rem;
  margin-top: 1rem;
  overflow-y: auto;
  flex-grow: 1;
}
</style>
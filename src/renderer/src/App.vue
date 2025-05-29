<script setup lang="js">
import ToolBar from './components/ToolBar.vue'
import ToolBarDetail from './components/ToolBarDetail.vue'
import { getAllTestScenarios } from './services/dataService'
// import { ipcRenderer } from "electron";

import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const route = useRoute()

const testScenarioTables = ref([])

onMounted(async () => {
  fetchTestScenarioTables()
})

const failing = ref(0)

const fetchTestScenarioTables = async () => {
  try {
    testScenarioTables.value = await getAllTestScenarios()
  } catch (error) {
    console.error('Error fetching test scenarios:', error)
  }
}
const namechanged = () => {
  fetchTestScenarioTables()
}

</script>

<template>
  <div class="app">
    <div class="window-controls">
      <img class="logo" src="./assets/img/8labs.svg" />
    </div>
    <div class="container">
      <ToolBarDetail :testScenarioTables="testScenarioTables" />
      <div class="panel">
        <RouterView @namechanged="namechanged" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: fixed;
  top: 2rem;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0 0 0.75rem 0.75rem;
  background-color: #fff;
}
.panel {
  flex-grow: 1;
  position: relative;
  border-radius: 0 0 0.75rem 0;

  scrollbar-width: none;
  scrollbar-color: #001d27 #00000012;
}
.window-controls {
  background-color: #001d27;
  color: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2rem;
  app-region: drag;
}
.window-controls .logo {
  height: 1rem;
  position: absolute;
  right: 1rem;
  top: 0.5rem;
}
</style>
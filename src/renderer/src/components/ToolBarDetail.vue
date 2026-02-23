<template>
  <div class="toolbar-detail">
    <div class="environment-bar"></div>
    <div class="filter-bar">
      <input
        type="text"
        placeholder="Filter"
        v-model="filterText"
        @input="handleFilter"
      />
      <RouterLink :to="{ path: '/tests/new' }">
        <img src="../assets/img/header-add.svg" />
      </RouterLink>
    </div>
    <div class="no-tests" v-if="filteredTests.length == 0">
      <p>No tests found.</p>
      <p>
        Create a
        <RouterLink :to="{ path: '/tests/new' }">new test scenario</RouterLink>
        to get started.
      </p>
    </div>
    <ul v-if="filteredTests.length > 0">
      <li
        :class="{ active: route.params.id == test.id }"
        v-for="test in filteredTests"
        v-bind:key="test.id"
        @contextmenu.prevent="showContextMenu($event, test)"
      >
        <RouterLink :to="{ path: '/tests/' + test.id }">
          <span class="method">{{ test.method }}</span
          >{{ test.name
          }}<span
            class="failure-count"
            v-if="getFailureCountForTest(test.id) > 0"
            ><img src="../assets/img/warningtriangle.svg" />
            <span>{{ getFailureCountForTest(test.id) }}</span></span
          >
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { ref, onMounted, computed, watch } from "vue";
import { getFailureCount } from "../services/testHistoryService";

const route = useRoute();
// const { user, isAuthenticated } = useAuth0()

const props = defineProps({
  testScenarioTables: {
    type: Array,
    required: true,
  },
});

const filterText = ref("");
const failureCounts = ref({});

const loadFailureCounts = async () => {
  for (const test of props.testScenarioTables) {
    try {
      failureCounts.value[test.id] = await getFailureCount(test.id);
    } catch (error) {
      console.error(`Error loading failure count for test ${test.id}:`, error);
      failureCounts.value[test.id] = 0;
    }
  }
};

const getFailureCountForTest = (testId) => {
  return failureCounts.value[testId] || 0;
};

const filteredTests = computed(() => {
  if (!filterText.value) {
    return props.testScenarioTables;
  }

  const searchText = filterText.value.toLowerCase();
  return props.testScenarioTables.filter((test) => {
    return (
      test.name.toLowerCase().includes(searchText) ||
      (test.endpoint && test.endpoint.toLowerCase().includes(searchText))
    );
  });
});

const handleFilter = () => {
  // This function can be used to add debouncing if needed
  // or to trigger additional actions when filtering
};

const showContextMenu = (event, test) => {
  window.eightlabs.loadScenarioListContextMenu(test.id);
};

onMounted(async () => {
  await loadFailureCounts();
});

watch(
  () => props.testScenarioTables,
  async () => {
    await loadFailureCounts();
  },
  { deep: true }
);
</script>

<style scoped>
/* Base container styles */
.toolbar-detail {
  padding: 0 1.5rem;
  padding-bottom: 1rem;
}

/* No tests message styles */
.no-tests {
  margin-top: 2rem;
  align-self: flex-start;
}

.no-tests p {
  margin: 0.5rem 0;
}

/* Link styles */
a {
  color: #00bfd3;
}

/* Logo bar styles */
.logobar {
  align-self: flex-start;
}

.logobar img {
  width: 75%;
  margin-top: 2rem;
  margin-left: 0.25rem;
}

/* Filter bar styles */
.filter-bar {
  margin-top: 2rem;
  display: flex;
  align-self: flex-start;
}

.filter-bar input {
  background-color: #001d27;
  border: 1px solid #00bfd3;
  padding: 0.5rem;
  color: #fff;
}

.filter-bar input::placeholder {
  color: #00bfd3;
  border: none;
}

.filter-bar input:focus {
  outline: none;
}

.filter-bar img {
  width: 1.25rem;
  margin-left: 0.75rem;
  margin-top: 0.5rem;
}

/* User section styles */
.user {
  position: absolute;
  bottom: 1.5rem;
  text-align: left;
  align-self: flex-start;
}

.user h3 {
  font-size: 1rem;
  font-weight: 300;
  padding: 0.5rem 0;
  margin: 0;
}

.user h4 {
  font-size: 0.75rem;
  font-weight: 300;
  padding: 0.5rem 0;
  margin: 0 0 0.5rem 0;
}

/* List styles */
ul {
  align-self: flex-start;
  overflow-y: auto;
}

li {
  width: calc(100% - 1.75rem);
  list-style-type: none;
  text-align: left;
  align-self: flex-start;
  padding-left: 0;
  margin-left: 0.75rem;
  cursor: pointer;
  user-select: none;
  position: relative;
}

li a {
  font-weight: 100;
  cursor: pointer;
}

li .method {
  font-size: 0.75rem;
  font-weight: 100;
  font-style: italic;
  padding-right: 0.5rem;
  margin: 0;
}

li a,
:visited {
  text-decoration: none;
  color: #fff;
}

li.active a,
li.active a:visited {
  color: #00bfd3;
}

/* Toolbar item styles */
.toolbar-item span {
  background-color: #fff;
  padding: 0 0.5rem;
  border-radius: 0.25rem;
  color: rgb(195, 52, 58);
  margin-left: 0.5rem;
}

/* Failure count styles */
.failure-count {
  position: absolute;
  right: 1rem;
}

.failure-count span {
  font-size: 0.75rem;
  position: absolute;
  line-height: 1rem;
  left: 0.5rem;
  color: #ffffff;
  padding: 0;
  margin: 0;
  min-width: 1.5rem;
  text-align: center;
  top: 0.25rem;
}

.failure-count img {
  width: 1.5rem;
  position: absolute;
  left: 0.5rem;
}
</style>
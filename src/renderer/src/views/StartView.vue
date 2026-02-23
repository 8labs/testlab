<template>
  <div class="panel">
    <img class="logo" src="../assets/img/logo.svg" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {})
</script>

<style scoped>
.logo {
  width: 30%;
  position: absolute;
  top: 50vh;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.5;
}

.panel {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #001d27;
}
</style>
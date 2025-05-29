<template>
  <div class="toolbar">
    <img src="../assets/img/logo.svg" class="toolbarlogo" />
    <ul>
      <li class="toolbar-item active">
        <RouterLink to="/"><img src="../assets/img/table.svg" /></RouterLink>
      </li>
      <!-- <li class="toolbar-item"><img src="/img/list.svg" /></li>
      <li class="toolbar-item"><img src="/img/reports.svg" /></li>
      <li class="toolbar-item"><img src="/img/users.svg" /></li>
      <li class="toolbar-item"><img src="/img/favourites.svg" /></li> -->
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
</script>

<style scoped>
.toolbar {
  position: relative;
}
.account {
  position: absolute;
  bottom: 0rem;
  padding: 1.5rem 0;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
}
.account img {
  width: 3rem;
  border-radius: 50%;
  padding: 0 0.5rem;
  cursor: pointer;
}

.account a {
  background-color: #00bfd3;
  padding: 0.5rem;
  border-radius: 0.25rem;
  color: #fff;
  margin-bottom: 1rem;
  cursor: pointer;
}
</style>
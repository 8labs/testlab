import { createRouter, createWebHistory } from 'vue-router'
import StartView from '../views/StartView.vue'
// import TestScenarioTableListView from '../views/TestScenarioTableListView.vue'
import TestScenariosView from '../views/TestScenariosView.vue'


import App from '../App.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/", component: StartView, name: "StartView"
    },
    //{ path: "/tests / ", component: TestScenarioTableListView, name: "TestScenarioTableListView" },
    { path: "/tests/:id", component: TestScenariosView, name: "TestScenarios" },
  ]
})

export default router

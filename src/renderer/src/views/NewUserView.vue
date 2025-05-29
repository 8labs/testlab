<template>
  <div class="panel">
    <div class="onboarding" v-if="!isAuthenticated">
      <h1>Great news!</h1>
      <p>
        Our trial period has been extended to 3 months. Enjoy TestLab for free for 90 days!
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const serverUrl = import.meta.env.VITE_SERVER_URL

export default {
  name: 'NewUserView',
  setup() {
    return {}
  },
  methods: {},
  props: {},
  async mounted() {
    const { getAccessTokenSilently } = useAuth0()
    const token = await getAccessTokenSilently()

    axios(serverUrl + '/user/userinfo', {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    }).then(async (response) => {
      const userInfo = response.data
    })
  },
}
</script>

<style scoped>
.panel {
  width: 100%;
  height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.panel h1 {
  color: white;
}

.onboarding {
  width: 30rem;
  height: 40rem;
  background-color: #53389f;
  border-radius: 0.5rem;
  align-self: center;
}
</style>
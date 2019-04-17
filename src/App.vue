<template>
  <div>
    <v-app class="primary">
      <notifications group="main" :duration="6000" :position="['top', 'left']"/>
      <home/>
    </v-app>
  </div>
</template>

<script>
import home from './components/home'

export default {
  name: 'App',
  components: {
    home
  }
}
</script>

<style>
#app {
  font-family: 'Jua', sans-serif;
}

.notifications {
  font-size: 20px;
}
</style>


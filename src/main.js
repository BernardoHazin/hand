import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import store from './store'
import { createProvider } from './vue-apollo'
import Notifications from 'vue-notification'
import '@fortawesome/fontawesome-free/css/all.css'

Vue.config.productionTip = false

Vue.use(Notifications)

new Vue({
  store,
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount('#app')

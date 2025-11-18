import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import 'primeicons/primeicons.css'
import './light.css'
import './dark.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')

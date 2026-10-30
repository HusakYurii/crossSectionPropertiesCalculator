import { createApp } from 'vue'
import 'vue3-toastify/dist/index.css';
// after the library's own stylesheet, so where both set the same variable ours wins
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

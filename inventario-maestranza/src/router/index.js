import { createRouter, createWebHistory } from 'vue-router'

// Vistas públicas
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegistroView from '../views/RegistroView.vue'

// Panel general
import DashboardView from '../views/DashboardView.vue'

// Vistas privadas (según rol)
import InventarioView from '../views/InventarioView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import MovimientosView from '../views/MovimientosView.vue'
import KitsView from '../views/KitsView.vue'
import AlertasView from '../views/AlertasView.vue'
import ReportesView from '../views/ReportesView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/registro', component: RegistroView },
  { path: '/dashboard', component: DashboardView },

  // Protegidas por rol
  { path: '/inventario', component: InventarioView },
  { path: '/usuarios', component: UsuariosView },
  { path: '/movimientos', component: MovimientosView },
  { path: '/kits', component: KitsView },
  { path: '/alertas', component: AlertasView },
  { path: '/reportes', component: ReportesView },

  // Ruta fallback por si no existe la ruta
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

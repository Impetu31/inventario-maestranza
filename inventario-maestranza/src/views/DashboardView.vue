<template>
  <div class="dashboard">
    <img src="../assets/logo.png" alt="Logo Maestranza" class="logo" />

    <h2>Bienvenido al Panel Principal</h2>
    <p>Aquí se mostrarán los accesos al sistema según tu rol.</p>

    <div v-if="rol === 'admin'">
      <h3>Opciones de Administrador</h3>
      <ul>
        <li><router-link to="/usuarios">👥 Gestión de Usuarios</router-link></li>
        <li><router-link to="/inventario">📦 Gestión de Inventario</router-link></li>
        <li><router-link to="/kits">🧰 Kits</router-link></li>
        <li><router-link to="/movimientos">🔄 Movimientos</router-link></li>
        <li><router-link to="/reportes">📊 Reportes</router-link></li>
        <li><router-link to="/alertas">🚨 Alertas</router-link></li>
      </ul>
    </div>

    <div v-else-if="rol === 'gestor'">
      <h3>Opciones de Gestor</h3>
      <ul>
        <li><router-link to="/inventario">📦 Gestión de Inventario</router-link></li>
        <li><router-link to="/kits">🧰 Kits</router-link></li>
        <li><router-link to="/movimientos">🔄 Movimientos</router-link></li>
        <li><router-link to="/reportes">📊 Reportes</router-link></li>
        <li><router-link to="/alertas">🚨 Alertas</router-link></li>
      </ul>
    </div>

    <div v-else-if="rol === 'trabajador'">
      <h3>Opciones de Trabajador</h3>
      <ul>
        <li><router-link to="/reportes">📊 Ver Reportes</router-link></li>
        <li><router-link to="/alertas">🚨 Ver Alertas</router-link></li>
      </ul>
    </div>

    <div v-else>
      <p>Rol no asignado o no autorizado. Contacta al administrador.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'

const rol = ref('')
const router = useRouter()

onMounted(async () => {
  const usuario = auth.currentUser
  if (usuario) {
    const docRef = doc(db, 'usuarios', usuario.uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      rol.value = docSnap.data().rol
    } else {
      console.warn('Usuario no encontrado en Firestore')
    }
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 600px;
  margin: 40px auto;
  font-family: Arial;
  text-align: center;
}
.logo {
  width: 180px;
  max-width: 90%;
  margin-bottom: 20px;
}
h3 {
  margin-top: 20px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 10px 0;
}
a {
  text-decoration: none;
  color: #4f46e5;
}
</style>

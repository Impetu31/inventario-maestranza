<template>
  <div class="login">
    <img src="../assets/logo.png" alt="Logo Maestranza" class="logo" />

    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="iniciarSesion">
      <input v-model="email" type="email" placeholder="Correo electrónico" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Ingresar</button>
    </form>
    <p v-if="mensaje" :style="{ color: mensajeColor }">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const router = useRouter()

const email = ref('')
const password = ref('')
const mensaje = ref('')
const mensajeColor = ref('red')

const iniciarSesion = async () => {
  try {
    const credenciales = await signInWithEmailAndPassword(auth, email.value, password.value)
    const usuario = credenciales.user

    const docRef = doc(db, "usuarios", usuario.uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()

      if (data.rol === 'pendiente') {
        mensaje.value = '❌ Tu cuenta está pendiente de aprobación por un administrador.'
        return
      }

      mensaje.value = `✅ Bienvenido ${data.nombre} (${data.rol})`
      mensajeColor.value = 'green'

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      mensaje.value = '❌ El perfil de usuario no existe en la base de datos.'
    }
  } catch (error) {
    mensaje.value = `❌ Error: ${error.message}`
  }
}
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-family: Arial;
  text-align: center;
}
.logo {
  width: 180px;
  max-width: 90%;
  margin-bottom: 20px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
button {
  padding: 10px;
  background-color: #10b981;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
</style>

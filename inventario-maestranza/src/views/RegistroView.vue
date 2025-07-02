<template>
  <div class="registro">
    <h2>Registro de Usuario</h2>
    <form @submit.prevent="registrarUsuario">
      <input v-model="nombre" type="text" placeholder="Nombre completo" required />
      <input v-model="email" type="email" placeholder="Correo electrónico" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <input v-model="confirmPassword" type="password" placeholder="Confirmar contraseña" required />

      <button type="submit">Registrarse</button>
    </form>
    <p v-if="mensaje" :style="{ color: mensajeColor }">{{ mensaje }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

const router = useRouter()

const nombre = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const mensaje = ref('')
const mensajeColor = ref('red')

const registrarUsuario = async () => {
  mensaje.value = ""
  mensajeColor.value = "red"

  if (password.value !== confirmPassword.value) {
    mensaje.value = '❌ Las contraseñas no coinciden'
    return
  }

  try {
    const credenciales = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const usuario = credenciales.user

    await setDoc(doc(db, "usuarios", usuario.uid), {
      uid: usuario.uid,
      nombre: nombre.value,
      email: email.value,
      rol: "pendiente"
    })

    mensaje.value = '✅ Usuario registrado correctamente. Espera la aprobación de un administrador.'
    mensajeColor.value = 'green'

    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      mensaje.value = '❌ El correo ya está registrado.'
    } else if (error.code === 'auth/weak-password') {
      mensaje.value = '❌ La contraseña debe tener al menos 6 caracteres.'
    } else if (error.code === 'auth/invalid-email') {
      mensaje.value = '❌ El formato del correo es inválido.'
    } else {
      mensaje.value = `❌ Error: ${error.message}`
    }
    mensajeColor.value = 'red'
  }
}
</script>

<style scoped>
.registro {
  max-width: 400px;
  margin: 30px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 10px;
  font-family: Arial;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
button {
  padding: 10px;
  background-color: #4f46e5;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
p {
  margin-top: 10px;
  font-weight: bold;
}
</style>

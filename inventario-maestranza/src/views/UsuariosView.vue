<template>
    <div class="usuarios">
      <h2>Gestión de Usuarios</h2>
      <p><strong>Rol:</strong> {{ rol }}</p>
  
      <div v-if="esAdmin">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol actual</th>
              <th>Nuevo rol</th>
              <th>Guardar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.uid">
              <td>{{ usuario.nombre }}</td>
              <td>{{ usuario.email }}</td>
              <td>{{ usuario.rol }}</td>
              <td>
                <select v-model="usuario.nuevoRol">
                  <option disabled value="">Selecciona rol</option>
                  <option value="admin">Admin</option>
                  <option value="gestor">Gestor</option>
                  <option value="trabajador">Trabajador</option>
                </select>
              </td>
              <td>
                <button @click="actualizarRol(usuario)">Guardar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <p v-else>No tienes permiso para gestionar usuarios.</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { auth, db } from '../firebase'
  import { onAuthStateChanged } from 'firebase/auth'
  import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
  
  const rol = ref('')
  const esAdmin = ref(false)
  const usuarios = ref([])
  
  const cargarRol = async (uid) => {
    const docSnap = await getDoc(doc(db, 'usuarios', uid))
    if (docSnap.exists()) {
      rol.value = docSnap.data().rol
      esAdmin.value = rol.value === 'admin'
    }
  }
  
  const cargarUsuarios = async () => {
    const snapshot = await getDocs(collection(db, 'usuarios'))
    usuarios.value = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        ...data,
        nuevoRol: data.rol
      }
    })
  }
  
  const actualizarRol = async (usuario) => {
    if (!usuario.nuevoRol || usuario.nuevoRol === usuario.rol) return
    await updateDoc(doc(db, 'usuarios', usuario.uid), {
      rol: usuario.nuevoRol
    })
    usuario.rol = usuario.nuevoRol
  }
    
  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await cargarRol(user.uid)
        if (esAdmin.value) {
          await cargarUsuarios()
        }
      }
    })
  })
  </script>
  
  <style scoped>
  .usuarios {
    max-width: 800px;
    margin: auto;
    font-family: Arial;
    padding: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  th, td {
    border: 1px solid #d1d5db;
    padding: 10px;
    text-align: left;
  }
  button {
    padding: 6px 12px;
    background-color: #10b981;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  select {
    padding: 5px;
  }
  </style>
  
<template>
  <div class="movimientos">
    <h2>Registro de Movimientos</h2>
    <p><strong>Rol:</strong> {{ rol }}</p>

    <h3>Historial de movimientos</h3>
    <ul>
      <li v-for="mov in movimientos" :key="mov.id">
        <strong>{{ mov.tipo.toUpperCase() }}</strong> |
        {{ mov.codigo }} - {{ mov.descripcion || 'Sin descripción' }} |
        Cantidad: {{ mov.cantidad }} |
        Usuario: {{ mov.usuario }} |
        {{ mov.fecha?.toDate().toLocaleString() }}<br />
        <em v-if="mov.observacion">Nota: {{ mov.observacion }}</em>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc, getDoc, collection, getDocs, query, orderBy
} from 'firebase/firestore'

const movimientos = ref([])
const rol = ref('')
const descripciones = ref({}) // Mapa de código => descripción

const cargarDescripciones = async () => {
  const snapshot = await getDocs(collection(db, 'inventario'))
  snapshot.forEach(doc => {
    const data = doc.data()
    descripciones.value[data.codigo] = data.descripcion
  })
}

const cargarMovimientos = async () => {
  const q = query(collection(db, 'movimientos'), orderBy('fecha', 'desc'))
  const snapshot = await getDocs(q)
  movimientos.value = snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      descripcion: descripciones.value[data.codigo] || ''
    }
  })
}

const cargarRol = async (uid) => {
  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    rol.value = docSnap.data().rol
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await cargarRol(user.uid)
      await cargarDescripciones()
      await cargarMovimientos()
    }
  })
})
</script>

<style scoped>
.movimientos {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  font-family: Arial;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  background: #f3f4f6;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
}
</style>

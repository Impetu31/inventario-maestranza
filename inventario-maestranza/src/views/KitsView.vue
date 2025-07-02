<template>
    <div class="kits">
      <h2>Gestión de Kits de Producción</h2>
      <p><strong>Rol:</strong> {{ rol }}</p>
  
      <div v-if="puedeCrear">
        <form @submit.prevent="crearKit">
          <input v-model="nombreKit" placeholder="Nombre del kit" required />
  
          <div v-for="(pieza, index) in piezasInventario" :key="pieza.id">
            <label>
              <input
                type="checkbox"
                :value="pieza.id"
                v-model="seleccionados"
              />
              {{ pieza.codigo }} - {{ pieza.descripcion }}
            </label>
            <input
              v-if="seleccionados.includes(pieza.id)"
              v-model.number="cantidades[pieza.id]"
              type="number"
              placeholder="Cantidad"
              min="1"
              required
            />
          </div>
  
          <button type="submit">Crear Kit</button>
        </form>
      </div>
  
      <div v-else-if="rol === 'trabajador'">
        <p>Estás en modo solo lectura. No puedes crear kits.</p>
      </div>
  
      <h3>Kits creados</h3>
      <ul>
        <li v-for="kit in kits" :key="kit.id">
          <strong>{{ kit.nombre }}</strong>
          <ul>
            <li v-for="pieza in kit.componentes" :key="pieza.id">
              {{ pieza.codigo }} - {{ pieza.descripcion }} (x{{ pieza.cantidad }})
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { auth, db } from '../firebase'
  import {
    onAuthStateChanged
  } from 'firebase/auth'
  import {
    collection, doc, getDoc, getDocs, addDoc
  } from 'firebase/firestore'
  
  const rol = ref('')
  const puedeCrear = ref(false)
  
  const nombreKit = ref('')
  const seleccionados = ref([])
  const cantidades = ref({})
  
  const piezasInventario = ref([])
  const kits = ref([])
  
  const cargarPiezas = async () => {
    const snap = await getDocs(collection(db, 'inventario'))
    piezasInventario.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  
  const cargarKits = async () => {
    const snap = await getDocs(collection(db, 'kits'))
    kits.value = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
  
  const cargarRol = async (uid) => {
    const userRef = doc(db, 'usuarios', uid)
    const docSnap = await getDoc(userRef)
    if (docSnap.exists()) {
      rol.value = docSnap.data().rol
      puedeCrear.value = rol.value === 'admin' || rol.value === 'gestor'
    }
  }
  
  const crearKit = async () => {
    const componentes = seleccionados.value.map(id => {
      const pieza = piezasInventario.value.find(p => p.id === id)
      return {
        id,
        codigo: pieza.codigo,
        descripcion: pieza.descripcion,
        cantidad: cantidades.value[id] || 1
      }
    })
  
    await addDoc(collection(db, 'kits'), {
      nombre: nombreKit.value,
      componentes
    })
  
    // Reset
    nombreKit.value = ''
    seleccionados.value = []
    cantidades.value = {}
    await cargarKits()
  }
  
  onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await cargarRol(user.uid)
        await cargarPiezas()
        await cargarKits()
      }
    })
  })
  </script>
  
  <style scoped>
  .kits {
    max-width: 700px;
    margin: auto;
    font-family: Arial;
    padding: 20px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #f0f0f0;
    padding: 15px;
    border-radius: 8px;
  }
  button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 10px;
    cursor: pointer;
    border-radius: 5px;
  }
  ul {
    list-style: none;
    padding-left: 20px;
  }
  li {
    margin-bottom: 5px;
  }
  </style>
  
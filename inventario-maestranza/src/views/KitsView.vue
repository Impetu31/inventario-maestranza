<template>
  <div class="kits">
    <h2>Gestión de Kits de Producción</h2>
    <p><strong>Rol:</strong> {{ rol }}</p>

    <div v-if="puedeCrear">
      <form @submit.prevent="crearKit">
        <input v-model="nombreKit" placeholder="Nombre del kit" required />

        <div v-if="piezasInventario.length">
          <div v-for="pieza in piezasInventario" :key="pieza.id" class="pieza-row">
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
        </div>
        <div v-else>
          <p>No hay piezas cargadas en el inventario.</p>
        </div>

        <button type="submit" :disabled="!seleccionados.length || !nombreKit.trim()">Crear Kit</button>
      </form>
    </div>

    <div v-else-if="rol === 'trabajador'">
      <p>Estás en modo solo lectura. No puedes crear kits.</p>
    </div>

    <h3>Kits creados</h3>
    <ul v-if="kits.length">
      <li v-for="kit in kits" :key="kit.id" class="kit-item">
        <div class="kit-header">
          <strong>{{ kit.nombre }}</strong>
          <button @click="eliminarKit(kit.id)" class="delete-btn">🗑️</button>
        </div>
        <p>Con el stock actual se pueden armar: <strong>{{ calcularKitsPosibles(kit) }}</strong> kits</p>
        <ul>
          <li v-for="pieza in kit.componentes" :key="pieza.id">
            {{ pieza.codigo }} - {{ pieza.descripcion }} (x{{ pieza.cantidad }})
          </li>
        </ul>
      </li>
    </ul>
    <p v-else>No hay kits registrados aún.</p>

    <!-- Exportar sección -->
    <div v-if="kits.length && puedeCrear" class="exportar-section">
      <h3>Exportar kits a PDF</h3>
      <ul>
        <li v-for="kit in kits" :key="kit.id">
          <label>
            <input type="checkbox" v-model="selectedKits" :value="kit" />
            {{ kit.nombre }}
          </label>
          <input
            v-if="selectedKits.includes(kit)"
            v-model.number="kitQuantities[kit.id]"
            type="number"
            min="1"
            placeholder="Cantidad a armar"
          />
        </li>
      </ul>
      <button :disabled="!selectedKits.length" @click="exportarPDF">Exportar a PDF</button>
    </div>

    <p v-if="mensajeExito" class="mensaje">{{ mensajeExito }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const rol = ref('')
const puedeCrear = ref(false)
const nombreKit = ref('')
const seleccionados = ref([])
const cantidades = ref({})
const piezasInventario = ref([])
const kits = ref([])
const selectedKits = ref([])
const kitQuantities = ref({})
const mensajeExito = ref('')

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
  if (!nombreKit.value.trim() || !seleccionados.value.length) return

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

  nombreKit.value = ''
  seleccionados.value = []
  cantidades.value = {}
  await cargarKits()
}

const eliminarKit = async (id) => {
  await deleteDoc(doc(db, 'kits', id))
  mensajeExito.value = 'Kit eliminado correctamente.'
  await cargarKits()

  setTimeout(() => {
    mensajeExito.value = ''
  }, 3000)
}

const calcularKitsPosibles = (kit) => {
  const cantidadesPosibles = kit.componentes.map(comp => {
    const pieza = piezasInventario.value.find(p => p.id === comp.id)
    if (!pieza || !pieza.stock || pieza.stock < comp.cantidad) return 0
    return Math.floor(pieza.stock / comp.cantidad)
  })
  return Math.min(...cantidadesPosibles)
}

const exportarPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text('Listado de Kits para Bodega', 14, 20)

  selectedKits.value.forEach((kit, index) => {
    const cantidad = kitQuantities.value[kit.id] || 1
    doc.setFontSize(14)
    doc.text(`Kit: ${kit.nombre} (Cantidad a armar: ${cantidad})`, 14, 30 + index * 70)

    const rows = kit.componentes.map(comp => {
      const pieza = piezasInventario.value.find(p => p.id === comp.id)
      return [
        comp.codigo,
        comp.descripcion,
        pieza?.ubicacion || 'No definida',
        `${comp.cantidad} x ${cantidad} = ${comp.cantidad * cantidad}`
      ]
    })

    autoTable(doc, {
      startY: 35 + index * 70,
      head: [['Código', 'Descripción', 'Ubicación', 'Cantidad total']],
      body: rows,
      theme: 'grid'
    })
  })

  doc.save('kits_bodega.pdf')
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
  max-width: 750px;
  margin: auto;
  font-family: Arial, sans-serif;
  padding: 20px;
}
form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f8f8;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.pieza-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
input[type="number"] {
  width: 100px;
}
button {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  border-radius: 5px;
}
button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}
ul {
  list-style: none;
  padding-left: 20px;
}
li {
  margin-bottom: 10px;
}
.kit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.delete-btn {
  background-color: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #dc2626;
}
.exportar-section {
  background: #eef2ff;
  padding: 20px;
  margin-top: 30px;
  border-radius: 8px;
}
.exportar-section input[type="number"] {
  width: 80px;
  margin-left: 10px;
}
.mensaje {
  background-color: #d1fae5;
  color: #065f46;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
  text-align: center;
}
</style>

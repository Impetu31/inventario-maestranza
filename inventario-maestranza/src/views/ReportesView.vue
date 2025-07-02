<template>
  <div class="reportes">
    <h2>Resumen del Inventario</h2>
    <p><strong>Rol:</strong> {{ rol }}</p>

    <div v-if="puedeVer">
      <ul>
        <li>Total de piezas: <strong>{{ totalPiezas }}</strong></li>
        <li>Stock total: <strong>{{ stockTotal }}</strong></li>
        <li>Movimientos registrados: <strong>{{ totalMovimientos }}</strong></li>
      </ul>

      <label for="topCount">Mostrar top piezas:</label>
      <input id="topCount" v-model.number="topCantidad" type="number" min="1" style="margin-bottom: 10px" />

      <h3>Top {{ topCantidad }} piezas con más stock</h3>
      <ol>
        <li v-for="pieza in topMasStock" :key="pieza.id">
          {{ pieza.codigo }} - {{ pieza.descripcion }} (Stock: {{ pieza.stock }})
        </li>
      </ol>

      <h3>Top {{ topCantidad }} piezas con menos stock</h3>
      <ol>
        <li v-for="pieza in topMenosStock" :key="pieza.id">
          {{ pieza.codigo }} - {{ pieza.descripcion }} (Stock: {{ pieza.stock }})
        </li>
      </ol>

      <h3>Piezas eliminadas recientemente</h3>
      <ul>
        <li v-for="mov in piezasEliminadas" :key="mov.id">
          {{ mov.codigo }} - {{ mov.descripcion }} | Usuario: {{ mov.usuario }} | {{ mov.fecha?.toDate().toLocaleString() }}
        </li>
      </ul>

      <h3>Usuarios más activos (por tipo de movimiento)</h3>
      <ul>
        <li v-for="(stats, usuario) in usuariosActivos" :key="usuario">
          {{ usuario }}: Total: {{ stats.total }}, Agregó: {{ stats.agregado }}, Quitó: {{ stats.quitado }}, Eliminó: {{ stats.eliminado }}
        </li>
      </ul>
    </div>

    <p v-else>No tienes permiso para ver los reportes.</p>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection, getDocs, doc, getDoc
} from 'firebase/firestore'

const totalPiezas = ref(0)
const stockTotal = ref(0)
const totalMovimientos = ref(0)
const topMasStock = ref([])
const topMenosStock = ref([])
const piezasEliminadas = ref([])
const usuariosActivos = ref({})
const rol = ref('')
const puedeVer = ref(false)
const topCantidad = ref(10)

const piezas = ref([])
const movimientos = ref([])

const calcularTop = () => {
  topMasStock.value = [...piezas.value].sort((a, b) => b.stock - a.stock).slice(0, topCantidad.value)
  topMenosStock.value = [...piezas.value].sort((a, b) => a.stock - b.stock).slice(0, topCantidad.value)
}

const cargarResumen = async () => {
  const inventarioSnap = await getDocs(collection(db, 'inventario'))
  piezas.value = inventarioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  totalPiezas.value = piezas.value.length
  stockTotal.value = piezas.value.reduce((total, p) => total + (p.stock || 0), 0)
  calcularTop()

  const movSnap = await getDocs(collection(db, 'movimientos'))
  movimientos.value = movSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  totalMovimientos.value = movimientos.value.length

  piezasEliminadas.value = movimientos.value.filter(m => m.tipo === 'eliminado').slice(0, 5)

  const actividad = {}
  for (const mov of movimientos.value) {
    if (!actividad[mov.usuario]) {
      actividad[mov.usuario] = { total: 0, agregado: 0, quitado: 0, eliminado: 0 }
    }
    actividad[mov.usuario].total++
    if (mov.tipo === 'agregado') actividad[mov.usuario].agregado++
    else if (mov.tipo === 'quitado') actividad[mov.usuario].quitado++
    else if (mov.tipo === 'eliminado') actividad[mov.usuario].eliminado++
  }
  usuariosActivos.value = Object.fromEntries(
    Object.entries(actividad).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
  )
}

watch(topCantidad, calcularTop)

const cargarRol = async (uid) => {
  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    rol.value = docSnap.data().rol
    puedeVer.value = true
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await cargarRol(user.uid)
      if (puedeVer.value) {
        await cargarResumen()
      }
    }
  })
})
</script>

<style scoped>
.reportes {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  font-family: Arial;
}
ul, ol {
  margin-top: 10px;
  padding-left: 20px;
}
li {
  margin-bottom: 5px;
}
</style>

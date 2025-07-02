<template>
  <div class="inventario">
    <h2>Gestión de Inventario</h2>

    <p><strong>Rol:</strong> {{ rol }}</p>

    <form v-if="puedeModificar" @submit.prevent="agregarPieza">
      <input v-model="codigo" placeholder="Código de pieza" required />
      <input v-model="descripcion" placeholder="Descripción" required />
      <input v-model.number="stock" placeholder="Cantidad inicial" type="number" required />
      <input v-model="ubicacion" placeholder="Ubicación" required />
      <input v-model="proveedorContacto" placeholder="Proveedor (teléfono o sitio)" required />
      <input v-model.number="stockMinimo" type="number" placeholder="Stock mínimo para alerta" min="0" required />
      <button type="submit">Agregar nueva pieza</button>
    </form>

    <p v-if="mensaje" :style="{ color: mensajeColor }">{{ mensaje }}</p>

    <input
      v-model="filtro"
      type="text"
      placeholder="Buscar por código o descripción"
      class="busqueda"
    />

    <h3>Piezas registradas:</h3>
    <ul>
      <li v-for="pieza in piezasFiltradas" :key="pieza.id">
        <strong>{{ pieza.codigo }}</strong> - {{ pieza.descripcion }} | 
        Stock: {{ pieza.stock }} | 
        Ubicación: {{ pieza.ubicacion }} |
        Proveedor: {{ pieza.proveedorContacto || 'N/D' }} |
        Stock mínimo: {{ pieza.stockMinimo || 'No definido' }}

        <div v-if="puedeModificar" class="acciones">
          <input v-model.number="pieza.cantidadCambio" type="number" min="1" placeholder="Cantidad" class="cantidad-input" />
          <button @click="cambiarStock(pieza, pieza.cantidadCambio || 1)">+ Agregar</button>
          <button @click="cambiarStock(pieza, -pieza.cantidadCambio || -1)" :disabled="pieza.stock <= 0">- Quitar</button>
          <button @click="eliminarPieza(pieza.id)">Eliminar</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'

const codigo = ref('')
const descripcion = ref('')
const stock = ref(0)
const ubicacion = ref('')
const proveedorContacto = ref('')
const stockMinimo = ref(0)

const piezas = ref([])
const filtro = ref('')
const rol = ref('')
const puedeModificar = ref(false)
const nombreUsuario = ref('')
const mensaje = ref('')
const mensajeColor = ref('')

const piezasFiltradas = computed(() => {
  if (!filtro.value) return piezas.value
  return piezas.value.filter(p =>
    p.codigo.toLowerCase().includes(filtro.value.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(filtro.value.toLowerCase())
  )
})

const cargarPiezas = async () => {
  const querySnapshot = await getDocs(collection(db, 'inventario'))
  piezas.value = querySnapshot.docs.map(doc => ({ id: doc.id, cantidadCambio: 1, ...doc.data() }))
}

const cargarRol = async (uid) => {
  const docRef = doc(db, 'usuarios', uid)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const data = docSnap.data()
    rol.value = data.rol
    nombreUsuario.value = data.nombre
    puedeModificar.value = rol.value === 'admin' || rol.value === 'gestor'
  }
}

const registrarMovimiento = async (tipo, pieza, cantidad, nota = '') => {
  await addDoc(collection(db, 'movimientos'), {
    tipo,
    codigo: pieza.codigo,
    descripcion: pieza.descripcion,
    cantidad,
    usuario: nombreUsuario.value,
    observacion: nota,
    fecha: serverTimestamp()
  })
}

const agregarPieza = async () => {
  if (!puedeModificar.value) return

  const snapshot = await getDocs(collection(db, 'inventario'))
  const yaExiste = snapshot.docs.some(doc => doc.data().codigo === codigo.value)

  if (yaExiste) {
    mensaje.value = '❌ Ya existe una pieza con ese código.'
    mensajeColor.value = 'red'
    return
  }

  const nuevaPieza = {
    codigo: codigo.value,
    descripcion: descripcion.value,
    stock: stock.value,
    ubicacion: ubicacion.value,
    proveedorContacto: proveedorContacto.value,
    stockMinimo: stockMinimo.value,
    fecha: serverTimestamp()
  }

  await addDoc(collection(db, 'inventario'), nuevaPieza)
  await registrarMovimiento('agregado', nuevaPieza, stock.value, 'Nueva pieza creada')

  mensaje.value = '✅ Pieza agregada correctamente.'
  mensajeColor.value = 'green'

  // Reset
  codigo.value = ''
  descripcion.value = ''
  stock.value = 0
  ubicacion.value = ''
  proveedorContacto.value = ''
  stockMinimo.value = 0

  await cargarPiezas()
  setTimeout(() => mensaje.value = '', 3000)
}

const cambiarStock = async (pieza, cantidad) => {
  const nuevaCantidad = pieza.stock + cantidad
  if (nuevaCantidad < 0) return

  const refPieza = doc(db, 'inventario', pieza.id)
  await updateDoc(refPieza, { stock: nuevaCantidad })

  const tipoMovimiento = cantidad > 0 ? 'agregado' : 'quitado'
  await registrarMovimiento(tipoMovimiento, pieza, Math.abs(cantidad))
  await cargarPiezas()
}

const eliminarPieza = async (id) => {
  const pieza = piezas.value.find(p => p.id === id)
  if (!pieza) return

  await deleteDoc(doc(db, 'inventario', id))
  await registrarMovimiento('eliminado', pieza, pieza.stock, 'Pieza eliminada')
  await cargarPiezas()
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await cargarRol(user.uid)
      await cargarPiezas()
    }
  })
})
</script>

<style scoped>
.inventario {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  font-family: Arial;
}
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
button {
  padding: 8px 12px;
  background-color: #059669;
  border: none;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
.busqueda {
  width: 100%;
  padding: 8px;
  margin: 20px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.acciones {
  margin-top: 8px;
}
.acciones button {
  margin-right: 8px;
  background-color: #2563eb;
}
.acciones button:last-child {
  background-color: #dc2626;
}
.cantidad-input {
  width: 80px;
  padding: 4px;
  margin-right: 8px;
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

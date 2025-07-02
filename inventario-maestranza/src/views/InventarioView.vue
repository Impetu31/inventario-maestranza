<template>
  <div class="inventario">
    <h2>Gestión de Inventario</h2>

    <p><strong>Rol:</strong> {{ rol }}</p>

    <form v-if="puedeModificar" @submit.prevent="agregarPieza">
      <input v-model="codigo" placeholder="Código de pieza" required />
      <input v-model="descripcion" placeholder="Descripción" required />
      <input v-model.number="stock" placeholder="Cantidad inicial" type="number" required />
      <input v-model="ubicacion" placeholder="Ubicación" required />
      <button type="submit">Agregar nueva pieza</button>
    </form>

    <p v-if="mensaje" :style="{ color: mensajeColor }">{{ mensaje }}</p>

    <h3>Piezas registradas:</h3>
    <ul>
      <li v-for="pieza in piezas" :key="pieza.id">
        <strong>{{ pieza.codigo }}</strong> - {{ pieza.descripcion }} | Stock: {{ pieza.stock }} | Ubicación: {{ pieza.ubicacion }}

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
import { ref, onMounted } from 'vue'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'

const codigo = ref('')
const descripcion = ref('')
const stock = ref(0)
const ubicacion = ref('')
const piezas = ref([])
const rol = ref('')
const puedeModificar = ref(false)
const nombreUsuario = ref('')
const mensaje = ref('')
const mensajeColor = ref('')

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
    fecha: serverTimestamp()
  }

  await addDoc(collection(db, 'inventario'), nuevaPieza)
  await registrarMovimiento('agregado', nuevaPieza, stock.value, 'Nueva pieza creada')

  mensaje.value = '✅ Pieza agregada correctamente.'
  mensajeColor.value = 'green'

  codigo.value = ''
  descripcion.value = ''
  stock.value = 0
  ubicacion.value = ''
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

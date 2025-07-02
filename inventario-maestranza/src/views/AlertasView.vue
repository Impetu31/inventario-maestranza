<template>
  <div class="alertas">
    <h2>Alertas de Stock Bajo</h2>

    <ul v-if="alertas.length">
      <li v-for="pieza in alertas" :key="pieza.id">
        <strong>{{ pieza.codigo }}</strong> - {{ pieza.descripcion }}<br />
        Stock actual: <span class="bajo">{{ pieza.stock }}</span><br />
        Stock mínimo: {{ pieza.stockMinimo }}<br />
        Ubicación: {{ pieza.ubicacion }}<br />
        Contacto proveedor: <a v-if="esEnlace(pieza.proveedorContacto)" :href="pieza.proveedorContacto" target="_blank">{{ pieza.proveedorContacto }}</a>
        <span v-else>{{ pieza.proveedorContacto }}</span>
      </li>
    </ul>

    <p v-else>No hay piezas en stock crítico.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

const alertas = ref([])

const cargarAlertas = async () => {
  const snapshot = await getDocs(collection(db, 'inventario'))
  alertas.value = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(p => typeof p.stockMinimo === 'number' && p.stock <= p.stockMinimo)
    .sort((a, b) => a.stock - b.stock)
}

const esEnlace = (contacto) => {
  return contacto?.startsWith('http') || contacto?.startsWith('www')
}

onMounted(() => {
  cargarAlertas()
})
</script>

<style scoped>
.alertas {
  max-width: 650px;
  margin: auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  background: #fef2f2;
  border: 1px solid #ef4444;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  line-height: 1.6;
}
.bajo {
  color: red;
  font-weight: bold;
}
a {
  color: #2563eb;
  text-decoration: underline;
}
</style>

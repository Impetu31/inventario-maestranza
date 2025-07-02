<template>
    <div class="alertas">
      <h2>Alertas de Stock Bajo</h2>
  
      <ul v-if="alertas.length">
        <li v-for="pieza in alertas" :key="pieza.id">
          <strong>{{ pieza.codigo }}</strong> - {{ pieza.descripcion }} |
          Stock actual: <span class="bajo">{{ pieza.stock }}</span> |
          Ubicación: {{ pieza.ubicacion }}
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
      .filter(pieza => pieza.stock <= 5)
  }
  
  onMounted(() => {
    cargarAlertas()
  })
  </script>
  
  <style scoped>
  .alertas {
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
    background: #fef2f2;
    border: 1px solid #ef4444;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
  }
  .bajo {
    color: red;
    font-weight: bold;
  }
  </style>
  
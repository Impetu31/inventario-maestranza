<template>
  <div class="home">
    <img src="../assets/logo.png" alt="Logo institucional" class="logo" />
    
    <h1>Bienvenido a Maestranzas Unidos S.A.</h1>
    <p>Sistema de Control de Inventario</p>

    <div class="acciones">
      <router-link to="/login"><button>Iniciar Sesión</button></router-link>
      <router-link to="/registro"><button>Registrarse</button></router-link>
    </div>
  </div>
</template>

<script setup>
// Lógica opcional más adelante
</script>

<style scoped>
.home {
  text-align: center;
  margin-top: 40px;
  font-family: Arial, sans-serif;
}

.logo {
  width: 180px;
  max-width: 90%;
  margin-bottom: 20px;
}

.acciones {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

button {
  padding: 12px 20px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #2563eb;
}
</style>

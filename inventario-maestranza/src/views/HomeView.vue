<template>
    <div class="home">
      <h1>Bienvenido a Maestranzas Unidos S.A.</h1>
      <p>Sistema de Control de Inventario</p>
      <div class="acciones">
        <router-link to="/login"><button>Iniciar Sesión</button></router-link>
        <router-link to="/registro"><button>Registrarse</button></router-link>
      </div>
    </div>
  </template>
  
  <script setup>
  // Sin lógica aún. Si quieres redirigir automáticamente al dashboard si está logueado,
  // lo podemos agregar luego.
  </script>
  
  <style scoped>
  .home {
    text-align: center;
    margin-top: 80px;
    font-family: Arial;
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
  </style>
  
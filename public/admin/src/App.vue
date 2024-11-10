<!-- src/App.vue -->
<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Global styles */
body {
  font-family: 'Roboto', sans-serif;
}

.sidebar {
  min-height: 100vh;
}

.nav-link {
  color: rgba(255,255,255,.8);
}

.nav-link:hover,
.nav-link.active {
  color: #fff;
  background: rgba(255,255,255,.1);
}
</style>
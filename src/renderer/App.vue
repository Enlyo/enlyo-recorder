<template>
    <div id="app">
        <router-view />
    </div>
</template>

<style lang="scss">
html,
body {
    height: 100%;
}

#app {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    height: 100%;
    width: 100%;
    background-color: $background-dark-3;
}
</style>

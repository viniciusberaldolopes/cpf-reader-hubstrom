<template>
  <button
    class="nav-item theme-toggle"
    type="button"
    :aria-pressed="isDark"
    :aria-label="`Alterar para o tema ${isDark ? 'claro' : 'escuro'}`"
    @click="$emit('toggle')"
  >
    <img :src="themeIcon" alt="" />
    {{ isDark ? "Tema Escuro" : "Tema Claro" }}
  </button>
</template>

<script>
import sunIcon from "../assets/icons/sun.svg";
import moonIcon from "../assets/icons/moon.svg";

export default {
  name: "ThemeToggle",
  props: {
    theme: { type: String, required: true },
  },
  computed: {
    isDark() {
      return this.theme === "dark";
    },
    themeIcon() {
      return this.isDark ? moonIcon : sunIcon;
    },
  },
};
</script>

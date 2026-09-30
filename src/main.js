import Vue from "vue";
import App from "./App.vue";
import "./assets/styles/main.scss";
import { initializeTheme } from "./services/theme.service";

// Evita a mensagem de modo de produção no console do navegador.
Vue.config.productionTip = false;

// Define o tema antes da renderização para evitar o flash do tema claro.
initializeTheme();

// Cria a instância raiz e renderiza a aplicação dentro da div #app.
new Vue({
  render: (createElement) => createElement(App),
}).$mount("#app");

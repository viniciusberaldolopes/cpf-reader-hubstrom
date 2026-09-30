const STORAGE_KEY = "cpf-reader-theme";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

function isValidTheme(theme) {
  return theme === "light" || theme === "dark";
}

// Usa a escolha salva; na primeira visita, respeita a preferência do sistema.
export function getPreferredTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (isValidTheme(savedTheme)) return savedTheme;

  return window.matchMedia(DARK_THEME_QUERY).matches ? "dark" : "light";
}

// O atributo data-theme ativa as variáveis CSS correspondentes no documento inteiro.
export function applyTheme(theme, persist = true) {
  const selectedTheme = isValidTheme(theme) ? theme : "light";
  document.documentElement.dataset.theme = selectedTheme;
  document.documentElement.style.colorScheme = selectedTheme;

  if (persist) localStorage.setItem(STORAGE_KEY, selectedTheme);
  return selectedTheme;
}

// Executada antes do Vue ser montado para evitar uma mudança visível de cores.
export function initializeTheme() {
  return applyTheme(getPreferredTheme(), false);
}

export function switchTheme(currentTheme) {
  return applyTheme(currentTheme === "dark" ? "light" : "dark");
}

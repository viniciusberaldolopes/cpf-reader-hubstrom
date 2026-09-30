<template>
  <section class="panel latest-panel">
    <header class="panel__header panel__header--row">
      <div>
        <h2>CPFs da última extração</h2>
        <p>Acompanhe o resultado do arquivo mais recente enviado.</p>
      </div>
      <button
        v-if="extraction"
        class="button button--brand"
        @click="$emit('upload')"
      >
        <img src="../assets/icons/upload-white.svg" alt="" /> Enviar novo PDF
      </button>
    </header>

    <template v-if="extraction">
      <div class="file-summary">
        <span class="file-summary__icon"
          ><img src="../assets/icons/pdf-file.svg" alt=""
        /></span>
        <div>
          <strong>{{ extraction.fileName }}</strong
          ><small
            >{{ formatSize(extraction.fileSize) }} <i></i>
            {{ formatDate(extraction.extractedAt) }}</small
          >
        </div>
        <a
          v-if="extraction.downloadUrl"
          :href="extraction.downloadUrl"
          target="_blank"
          rel="noopener"
          class="button button--dark"
          >Baixar arquivo</a
        >
      </div>
      <div class="table-scroll latest-table">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>CPF</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cpf in extraction.cpfs" :key="cpf.normalized">
              <td>
                <span
                  class="status"
                  :class="cpf.isValid ? 'status--valid' : 'status--invalid'"
                  >{{ cpf.isValid ? "Válido" : "Inválido" }}</span
                >
              </td>
              <td>{{ cpf.formatted }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="empty-state empty-state--upload">
      <span class="empty-state__icon"
        ><img src="../assets/icons/upload-empty.svg" alt=""
      /></span>
      <h3>Comece enviando um PDF</h3>
      <p>
        Ao enviar um arquivo, o sistema identifica e armazena os CPFs válidos.
      </p>
      <button class="button button--brand" @click="$emit('upload')">
        <img src="../assets/icons/upload-white.svg" alt="" /> Enviar PDF
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: "LatestExtraction",
  props: { extraction: { type: Object, default: null } },
  methods: {
    formatDate(value) {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    },
    formatSize(bytes) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    },
  },
};
</script>

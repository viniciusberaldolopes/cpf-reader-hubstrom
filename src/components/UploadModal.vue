<template>
  <!-- O clique no fundo fecha o modal; cliques no conteúdo não se propagam. -->
  <div class="modal-backdrop" @click.self="$emit('close')">
    <section
      class="upload-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-title"
    >
      <header class="upload-modal__header">
        <div>
          <h2 id="upload-title">Enviar arquivos</h2>
          <p>Selecione um arquivo PDF para extrair CPFs e CNPJs.</p>
        </div>
        <button
          class="close-button"
          aria-label="Fechar"
          @click="$emit('close')"
        >
          <img src="../assets/icons/close.svg" alt="" />
        </button>
      </header>

      <!-- Input nativo invisível acionado pelas áreas visuais de seleção. -->
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        @change="selectFromInput"
      />
      <!-- Área aceita clique e também arquivo arrastado pelo usuário. -->
      <button
        v-if="!file"
        class="drop-zone"
        :class="{ 'drop-zone--active': isDragging }"
        @click="$refs.fileInput.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="selectDropped"
      >
        <img src="../assets/icons/upload-area.svg" alt="" />
        <strong>Arraste e solte seu arquivo aqui</strong><span>ou</span
        ><u>Selecionar arquivos</u>
      </button>
      <div v-else class="drop-zone drop-zone--selected">
        <span class="selected-file__icon"
          ><img src="../assets/icons/pdf-file.svg" alt=""
        /></span>
        <strong>{{ file.name }}</strong>
        <button @click="$refs.fileInput.click()">Substituir arquivo</button>
      </div>

      <!-- Feedback compartilhado com o componente pai por props. -->
      <div v-if="isProcessing" class="progress">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <p v-if="errorMessage" class="modal-error">{{ errorMessage }}</p>

      <footer class="upload-modal__footer">
        <button
          class="button button--light"
          :disabled="isProcessing"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button
          class="button button--brand"
          :disabled="!file || isProcessing"
          @click="$emit('submit', file)"
        >
          <img src="../assets/icons/extract-white.svg" alt="" />
          {{ isProcessing ? "Processando..." : "Extrair documentos" }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script>
export default {
  name: "UploadModal",
  props: {
    isProcessing: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  data() {
    return { file: null, isDragging: false };
  },
  methods: {
    // Entrada pelo seletor de arquivos do sistema operacional.
    selectFromInput(event) {
      this.setFile(event.target.files[0]);
    },
    // Entrada por arrastar e soltar dentro da área pontilhada.
    selectDropped(event) {
      this.isDragging = false;
      this.setFile(event.dataTransfer.files[0]);
    },
    setFile(file) {
      if (file) this.file = file;
    },
  },
};
</script>

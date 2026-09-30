<template>
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
          <p>Selecione um arquivo PDF com texto para extrair os CPFs.</p>
        </div>
        <button
          class="close-button"
          aria-label="Fechar"
          @click="$emit('close')"
        >
          <img src="../assets/icons/close.svg" alt="" />
        </button>
      </header>

      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        @change="selectFromInput"
      />
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
          {{ isProcessing ? "Processando..." : "Extrair CPF" }}
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
    selectFromInput(event) {
      this.setFile(event.target.files[0]);
    },
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

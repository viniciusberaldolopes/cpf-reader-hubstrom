<template>
  <div class="app-shell">
    <header class="topbar">
      <img src="./assets/icons/logo.svg" alt="Hubstrom" />
    </header>
    <aside class="sidebar">
      <button class="nav-item nav-item--active">
        <img src="./assets/icons/navigation.svg" alt="" /> Teste HubStrom
      </button>
      <hr />
      <button class="nav-item">
        <img src="./assets/icons/sun.svg" alt="" /> Tema Claro
      </button>
      <span class="sidebar-toggle"
        ><img src="./assets/icons/arrow.svg" alt=""
      /></span>
    </aside>

    <main class="main-content">
      <div class="app-header">
        <h1>Teste Hubstrom</h1>
        <span>Extrator de CPF</span>
      </div>
      <div class="dashboard">
        <header class="dashboard-heading">
          <div>
            <h2>Extrator de CPF</h2>
            <p>
              Faça o upload de um PDF e receba apenas os CPFs válidos, prontos e
              armazenados.
            </p>
          </div>
          <small>Última atualização: {{ lastUpdate }}</small>
        </header>

        <p v-if="feedbackMessage" class="toast">{{ feedbackMessage }}</p>

        <section class="stats-grid">
          <StatCard
            title="CPFs armazenados"
            :value="cpfRecords.length"
            subtitle="Validados em todos os uploads"
            :icon="icons.stored"
            tone="green"
            featured
          />
          <StatCard
            title="PDFs processados"
            :value="uploads.length"
            subtitle="Arquivos enviados até agora"
            :icon="icons.pdf"
          />
          <StatCard
            title="Válidos na ultima extração"
            :value="latestValidCount"
            subtitle="Salvos no banco de dados"
            :icon="icons.valid"
            tone="green"
          />
          <StatCard
            title="Inválidos na última extração"
            :value="latestInvalidCount"
            subtitle="Formato ou dígito incorretos"
            :icon="icons.invalid"
            tone="red"
          />
        </section>

        <section class="tables-grid">
          <CpfHistoryTable :records="cpfRecords" />
          <LatestExtraction
            :extraction="latestExtraction"
            @upload="openUpload"
          />
        </section>
      </div>
    </main>

    <UploadModal
      v-if="showUpload"
      :is-processing="isProcessing"
      :progress="uploadProgress"
      :error-message="errorMessage"
      @close="closeUpload"
      @submit="processFile"
    />
  </div>
</template>

<script>
import StatCard from "./components/StatCard.vue";
import CpfHistoryTable from "./components/CpfHistoryTable.vue";
import LatestExtraction from "./components/LatestExtraction.vue";
import UploadModal from "./components/UploadModal.vue";
import { extractCpfs } from "./services/cpf.service";
import { extractTextFromPdf } from "./services/pdf.service";
import { isFirebaseConfigured } from "./services/firebase";
import {
  createUploadId,
  saveExtraction,
  subscribeToCpfRecords,
  subscribeToUploads,
} from "./services/database.service";
import { uploadPdf, removePdf } from "./services/storage.service";

export default {
  name: "App",
  components: { StatCard, CpfHistoryTable, LatestExtraction, UploadModal },

  data() {
    return {
      showUpload: false,
      isProcessing: false,
      uploadProgress: 0,
      errorMessage: "",
      feedbackMessage: "",
      latestExtraction: null,
      cpfRecords: [],
      uploads: [],
      unsubscribers: [],
      firebaseConfigured: isFirebaseConfigured,
      icons: {
        stored: new URL("./assets/icons/cpf-stored.svg", import.meta.url).href,
        pdf: new URL("./assets/icons/pdf-count.svg", import.meta.url).href,
        valid: new URL("./assets/icons/valid.svg", import.meta.url).href,
        invalid: new URL("./assets/icons/invalid.svg", import.meta.url).href,
      },
    };
  },

  computed: {
    latestValidCount() {
      return this.latestExtraction
        ? this.latestExtraction.cpfs.filter((cpf) => cpf.isValid).length
        : 0;
    },
    latestInvalidCount() {
      return this.latestExtraction
        ? this.latestExtraction.cpfs.filter((cpf) => !cpf.isValid).length
        : 0;
    },
    lastUpdate() {
      if (!this.uploads.length) return "—";
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(this.uploads[0].uploadedAt));
    },
  },

  created() {
    if (!this.firebaseConfigured) return;
    this.unsubscribers.push(
      subscribeToCpfRecords((items) => {
        this.cpfRecords = items;
      }, this.handleFirebaseError),
    );
    this.unsubscribers.push(
      subscribeToUploads((items) => {
        this.uploads = items;
      }, this.handleFirebaseError),
    );
  },

  beforeDestroy() {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  },

  methods: {
    openUpload() {
      this.showUpload = true;
      this.errorMessage = "";
      this.feedbackMessage = "";
    },
    closeUpload() {
      if (!this.isProcessing) this.showUpload = false;
    },
    handleFirebaseError(error) {
      console.error(error);
      this.feedbackMessage = "Não foi possível carregar os dados do Firebase.";
    },
    async processFile(file) {
      this.errorMessage = "";
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        this.errorMessage = "Selecione um arquivo PDF.";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = "O PDF deve ter no máximo 10 MB.";
        return;
      }
      this.isProcessing = true;
      let storagePath = "";

      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim())
          throw new Error(
            "O PDF não possui texto legível. Ele pode estar escaneado.",
          );
        const cpfs = extractCpfs(text);
        const validCpfs = cpfs.filter((cpf) => cpf.isValid);
        if (!this.firebaseConfigured)
          throw new Error(
            "Configure as variáveis do Firebase no arquivo .env antes de salvar.",
          );
        const uploadId = createUploadId();
        const uploaded = await uploadPdf(file, uploadId, (value) => {
          this.uploadProgress = value;
        });
        storagePath = uploaded.storagePath;
        const extractedAt = await saveExtraction({
          uploadId,
          file,
          ...uploaded,
          validCpfs,
          invalidCount: cpfs.length - validCpfs.length,
        });
        this.latestExtraction = {
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          downloadUrl: uploaded.downloadUrl,
          extractedAt,
          cpfs,
        };
        this.feedbackMessage = `Arquivo processado: ${validCpfs.length} CPF(s) válido(s) salvo(s).`;
        this.showUpload = false;
      } catch (error) {
        console.error(error);
        if (storagePath) {
          try {
            await removePdf(storagePath);
          } catch (rollbackError) {
            console.error(rollbackError);
          }
        }
        this.errorMessage =
          error.message || "Não foi possível processar o PDF.";
      } finally {
        this.isProcessing = false;
        this.uploadProgress = 0;
      }
    },
  },
};
</script>

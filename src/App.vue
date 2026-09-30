<template>
  <div class="app-shell">
    <!-- Estrutura fixa de navegação reproduzida do layout do Figma. -->
    <header class="topbar">
      <img src="./assets/icons/logo.svg" alt="Hubstrom" />
    </header>
    <aside class="sidebar">
      <button class="nav-item nav-item--active">
        <img src="./assets/icons/navigation.svg" alt="" /> Teste HubStrom
      </button>
      <hr />
      <ThemeToggle :theme="theme" @toggle="toggleTheme" />
      <span class="sidebar-toggle"
        ><img src="./assets/icons/arrow.svg" alt=""
      /></span>
    </aside>

    <main class="main-content">
      <!-- Cabeçalho que identifica o teste e a página selecionada. -->
      <div class="app-header">
        <h1>Teste Hubstrom</h1>
        <span>Extrator de documentos</span>
      </div>
      <div class="dashboard">
        <header class="dashboard-heading">
          <div>
            <h2>Extrator de CPF e CNPJ</h2>
            <p>
              Faça o upload de um PDF e receba CPFs e CNPJs válidos, prontos e
              armazenados.
            </p>
          </div>
          <small>Última atualização: {{ lastUpdate }}</small>
        </header>

        <p v-if="feedbackMessage" class="toast">{{ feedbackMessage }}</p>

        <!-- Resumo numérico calculado a partir dos dados do Firebase. -->
        <section class="stats-grid">
          <StatCard
            title="Documentos armazenados"
            :value="documentRecords.length"
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

        <!-- Histórico completo à esquerda e resultado atual à direita. -->
        <section class="tables-grid">
          <DocumentHistoryTable :records="documentRecords" />
          <LatestExtraction
            :extraction="latestExtraction"
            @upload="openUpload"
          />
        </section>
      </div>
    </main>

    <!-- O modal só entra no DOM quando o usuário solicita um upload. -->
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
import DocumentHistoryTable from "./components/DocumentHistoryTable.vue";
import LatestExtraction from "./components/LatestExtraction.vue";
import UploadModal from "./components/UploadModal.vue";
import ThemeToggle from "./components/ThemeToggle.vue";
import { extractDocuments } from "./services/cpf.service";
import { extractTextFromPdf } from "./services/pdf.service";
import { isFirebaseConfigured } from "./services/firebase";
import { isSupabaseConfigured } from "./services/supabase";
import {
  createUploadId,
  saveExtraction,
  subscribeToDocumentRecords,
  subscribeToUploads,
} from "./services/database.service";
import { uploadPdf, removePdf } from "./services/storage.service";
import { switchTheme } from "./services/theme.service";

export default {
  name: "App",
  components: {
    StatCard,
    DocumentHistoryTable,
    LatestExtraction,
    UploadModal,
    ThemeToggle,
  },

  data() {
    return {
      theme: document.documentElement.dataset.theme || "light",
      // Estado da janela de upload e do processamento atual.
      showUpload: false,
      isProcessing: false,
      uploadProgress: 0,
      errorMessage: "",
      feedbackMessage: "",
      // Dados apresentados nas tabelas e nos cards do dashboard.
      latestExtraction: null,
      documentRecords: [],
      uploads: [],
      // Guarda as funções que cancelam os listeners do Firebase.
      unsubscribers: [],
      firebaseConfigured: isFirebaseConfigured,
      supabaseConfigured: isSupabaseConfigured,
      icons: {
        stored: new URL("./assets/icons/cpf-stored.svg", import.meta.url).href,
        pdf: new URL("./assets/icons/pdf-count.svg", import.meta.url).href,
        valid: new URL("./assets/icons/valid.svg", import.meta.url).href,
        invalid: new URL("./assets/icons/invalid.svg", import.meta.url).href,
      },
    };
  },

  computed: {
    // Os dois contadores abaixo consideram somente o upload mais recente.
    latestValidCount() {
      return this.latestExtraction
        ? this.latestExtraction.validCount
        : 0;
    },
    latestInvalidCount() {
      return this.latestExtraction ? this.latestExtraction.invalidCount : 0;
    },
    lastUpdate() {
      if (!this.uploads.length) return "—";

      // A lista já chega ordenada; o primeiro item é o upload mais recente.
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(this.uploads[0].uploadedAt));
    },
  },

  created() {
    if (!this.firebaseConfigured) return;

    // Mantém o histórico sincronizado sempre que o banco receber alterações.
    this.unsubscribers.push(
      subscribeToDocumentRecords((items) => {
        this.documentRecords = items;
        this.restoreLatestExtraction();
      }, this.handleFirebaseError)
    );
    this.unsubscribers.push(
      subscribeToUploads((items) => {
        this.uploads = items;
        this.restoreLatestExtraction();
      }, this.handleFirebaseError)
    );
  },

  beforeDestroy() {
    // Remove os listeners para não deixar conexões abertas ao destruir o componente.
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
  },

  methods: {
    restoreLatestExtraction() {
      const latestUpload = this.uploads[0];
      if (!latestUpload) return;

      // Uploads novos guardam todos os resultados. Para uploads antigos,
      // recupera os documentos validos que ja estavam no historico.
      const documents = Array.isArray(latestUpload.documents)
        ? latestUpload.documents
        : this.documentRecords
            .filter((record) => record.uploadId === latestUpload.id)
            .map((record) => ({
              type: record.type,
              formatted: record.formatted,
              normalized: record.normalized,
              isValid: true,
            }));

      this.latestExtraction = {
        uploadId: latestUpload.id,
        fileName: latestUpload.fileName,
        fileSize: latestUpload.fileSize,
        downloadUrl: latestUpload.downloadUrl,
        extractedAt: latestUpload.uploadedAt,
        validCount: latestUpload.validCount || 0,
        invalidCount: latestUpload.invalidCount || 0,
        documents,
      };
    },
    toggleTheme() {
      this.theme = switchTheme(this.theme);
    },
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

      // Alguns navegadores não preenchem o MIME type, por isso a extensão também é aceita.
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
      this.uploadProgress = 10;
      let storagePath = "";

      try {
        // Fluxo: lê o texto, valida documentos, envia o PDF e persiste os resultados.
        const text = await extractTextFromPdf(file, (value) => {
          this.uploadProgress = value;
        });
        this.uploadProgress = 40;
        if (!text.trim())
          throw new Error(
            "O PDF não possui texto legível. Ele pode estar escaneado."
          );
        const documents = extractDocuments(text);
        const validDocuments = documents.filter((document) => document.isValid);

        // Interrompe antes do upload quando algum serviço não foi configurado.
        if (!this.firebaseConfigured)
          throw new Error(
            "Configure as variáveis do Firebase no arquivo .env antes de salvar."
          );
        if (!this.supabaseConfigured)
          throw new Error(
            "Configure as variáveis do Supabase no arquivo .env antes de salvar."
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
          documents,
          validDocuments,
          invalidCount: documents.length - validDocuments.length,
        });
        this.latestExtraction = {
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          downloadUrl: uploaded.downloadUrl,
          extractedAt,
          validCount: validDocuments.length,
          invalidCount: documents.length - validDocuments.length,
          documents,
        };
        this.feedbackMessage = `Arquivo processado: ${validDocuments.length} documento(s) válido(s) salvo(s).`;
        this.showUpload = false;
      } catch (error) {
        console.error(error);

        // Se a segunda etapa falhar, remove o arquivo que já foi enviado.
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
        // Executado tanto em caso de sucesso quanto de erro.
        this.isProcessing = false;
        this.uploadProgress = 0;
      }
    },
  },
};
</script>

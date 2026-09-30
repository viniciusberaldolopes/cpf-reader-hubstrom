<template>
  <!-- Painel responsável pelo histórico de todos os documentos válidos. -->
  <section class="panel history-panel">
    <header class="panel__header">
      <h2>Todos os documentos armazenados</h2>
      <p>Acompanhe a lista de CPFs e CNPJs válidos já salvos.</p>
    </header>

    <!-- O v-model mantém o texto digitado sincronizado com data.search. -->
    <div
      class="search-field"
      :class="{ 'search-field--disabled': !records.length }"
    >
      <label for="document-search">Pesquisar</label>
      <div class="search-field__control">
        <img src="../assets/icons/search.svg" alt="" />
        <input
          id="document-search"
          v-model="search"
          :disabled="!records.length"
          placeholder="Digite o CPF, CNPJ ou nome do arquivo"
        />
      </div>
    </div>

    <!-- Com registros, exibe a tabela; sem registros, mostra o estado vazio. -->
    <div v-if="records.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Documento</th>
            <th>Nome do arquivo</th>
            <th>Data de extração</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredRecords" :key="record.id">
            <td>{{ record.type }}</td>
            <td>{{ record.formatted }}</td>
            <td>{{ record.fileName }}</td>
            <td>{{ formatDate(record.extractedAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!filteredRecords.length" class="no-results">
        Nenhum resultado encontrado.
      </p>
    </div>

    <div v-else class="empty-state">
      <span class="empty-state__icon"
        ><img src="../assets/icons/database-empty.svg" alt=""
      /></span>
      <h3>Nenhum documento armazenado ainda</h3>
      <p>
        Assim que você enviar um PDF, os CPFs e CNPJs válidos ficam salvos e
        listados aqui.
      </p>
    </div>
  </section>
</template>

<script>
export default {
  name: "DocumentHistoryTable",
  props: { records: { type: Array, default: () => [] } },
  data() {
    return { search: "" };
  },
  computed: {
    filteredRecords() {
      const term = this.search.trim().toLowerCase();
      const normalizedTerm = term.replace(/[^a-z0-9]/g, "");
      if (!term) return this.records;

      return this.records.filter(
        (item) =>
          item.type.toLowerCase().includes(term) ||
          item.formatted.toLowerCase().includes(term) ||
          item.normalized.toLowerCase().includes(normalizedTerm) ||
          item.fileName.toLowerCase().includes(term)
      );
    },
  },
  methods: {
    formatDate(value) {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    },
  },
};
</script>

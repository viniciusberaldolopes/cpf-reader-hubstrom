<template>
  <section class="panel history-panel">
    <header class="panel__header">
      <h2>Todos os CPFs armazenados</h2>
      <p>
        Acompanhe a lista de todos os CPFs válidos já salvos no banco de dados.
      </p>
    </header>

    <div
      class="search-field"
      :class="{ 'search-field--disabled': !records.length }"
    >
      <label for="cpf-search">Pesquisar</label>
      <div class="search-field__control">
        <img src="../assets/icons/search.svg" alt="" />
        <input
          id="cpf-search"
          v-model="search"
          :disabled="!records.length"
          placeholder="Digite o cpf ou nome do arquivo"
        />
      </div>
    </div>

    <div v-if="records.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CPF</th>
            <th>Nome do arquivo</th>
            <th>Data de extração</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredRecords" :key="record.id">
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
      <h3>Nenhum CPF armazenado ainda</h3>
      <p>
        Assim que você enviar um PDF, os CPFs válidos extraídos ficam salvos e
        listados aqui.
      </p>
    </div>
  </section>
</template>

<script>
export default {
  name: "CpfHistoryTable",
  props: { records: { type: Array, default: () => [] } },
  data() {
    return { search: "" };
  },
  computed: {
    filteredRecords() {
      const term = this.search.trim().toLowerCase();
      const digits = term.replace(/\D/g, "");
      if (!term) return this.records;
      return this.records.filter(
        (item) =>
          item.formatted.toLowerCase().includes(term) ||
          item.normalized.includes(digits) ||
          item.fileName.toLowerCase().includes(term),
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

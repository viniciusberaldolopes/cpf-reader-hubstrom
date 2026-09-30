<template>
  <article class="stat-card" :class="{ 'stat-card--featured': featured }">
    <div class="stat-card__header">
      <span class="stat-card__icon" :class="`stat-card__icon--${tone}`">
        <img :src="icon" alt="" />
      </span>
      <h3>{{ title }}</h3>
    </div>
    <div>
      <strong>{{ value }}</strong>
      <p>{{ subtitle }}</p>
    </div>
  </article>
</template>

<script>
export default {
  name: "StatCard",
  props: {
    title: { type: String, required: true },
    value: { type: Number, default: 0 },
    subtitle: { type: String, required: true },
    icon: { type: String, required: true },
    tone: { type: String, default: "neutral" },
    featured: { type: Boolean, default: false },
  },
};
</script>

<script setup lang="ts">
defineProps<{
  label: string;
}>();
</script>

<template>
  <div class="placeholder">
    <p>{{ label }} form is not ready yet.</p>
  </div>
</template>

<style scoped>
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  color: var(--color-text);
  opacity: 0.6;
  font-size: 13px;
}
</style>

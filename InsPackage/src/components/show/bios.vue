<script setup lang="ts">
import { computed } from "vue";
import deviceData from "@/components/state/data";

const data = computed(() => {
  return deviceData.value.bios;
});

// BIOS 信息的数组
const biosItems = [
  { label: "供应商", value: data.value.vendor },
  { label: "版本", value: data.value.version },
  { label: "发布日期", value: data.value.releaseDate },
  { label: "校订", value: data.value.revision },
  { label: "语言", value: data.value.langage },
  { label: "特征", value: data.value.features },
  { label: "序列号", value: data.value.serial },
  
];
</script>

<template>
  <div class="details">
    <h2>BIOS</h2>
    <ul>
      <template v-for="item in biosItems" :key="item.label">
        <li v-if="item.value && item.value !== ''">
          <span>{{ item.label }}</span>
          <span>{{ item.value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped lang="less"></style>

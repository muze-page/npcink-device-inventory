<script setup lang="ts">
//主板
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { formatBytes } from "@/components/state/tool";

const data = computed(() => {
  return deviceData.value.baseboard;
});

// 主板信息的数组
const boardItems = [
  { label: "制造商", value: data.value.manufacturer },
  { label: "型号", value: data.value.model },
  { label: "版本", value: data.value.version },
  { label: "序列号", value: data.value.serial },
  { label: "资产标签", value: data.value.assetTag },
  { label: "最大内存", value: formatBytes(data.value.memMax, "g") },
  { label: "内存插槽", value: data.value.memSlots },
];
</script>

<template>
  <div class="details">
    <h2>主板</h2>
    <ul>
      <template v-for="item in boardItems" :key="item.label">
        <li v-if="item.value && item.value !== ''">
          <span>{{ item.label }}</span>
          <span>{{ item.value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped lang="less"></style>

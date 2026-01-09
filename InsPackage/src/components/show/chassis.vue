<script setup lang="ts">
import { computed } from "vue";
import deviceData from "@/components/state/data";

const data = computed(() => {
  return deviceData.value.chassis;
});

// 机箱信息的数组
const chassisItems = [
  { label: "厂家", value: data.value.manufacturer },
  { label: "型号", value: data.value.model },
  { label: "类型", value: data.value.type },
  { label: "版本", value: data.value.version },
  { label: "序号", value: data.value.serial },
  { label: "资产标签", value: data.value.assetTag },
  { label: "货号", value: data.value.sku },
];
</script>

<template>
  <div class="details">
    <h2>机箱</h2>
    <ul>
      <template v-for="item in chassisItems" :key="item.label">
        <li v-if="item.value && item.value !== ''">
          <span>{{ item.label }}</span>
          <span>{{ item.value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped lang="less"></style>

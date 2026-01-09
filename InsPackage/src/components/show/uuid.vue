<script setup lang="ts">
//UUID
import { computed } from "vue";
import deviceData from "@/components/state/data";

const data = computed(() => {
  return deviceData.value.uuid;
});

// 机箱信息的数组
const chassisItems = [
  { label: "系统", value: data.value.os },
  { label: "硬件", value: data.value.hardware },
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
    <ul v-for="(item, index) in data.macs" :key="index">
      <li>
        <span>网口 - {{ index }}</span
        ><span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="less"></style>

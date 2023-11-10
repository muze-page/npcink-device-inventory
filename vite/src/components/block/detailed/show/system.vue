<script setup lang="ts">
//系统
//https://systeminformation.io/system.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { judge_bool } from "@/components/state/tool";
const data = computed(() => {
  return deviceData.value.system;
});
const dataLists = [
  { label: "厂家", value: data.value.manufacturer },
  { label: "型号", value: data.value.model },
  { label: "版本", value: data.value.version },
  { label: "序列号", value: data.value.serial },
  { label: "货号", value: data.value.sku },
  { label: "虚拟机", value: judge_bool(data.value.virtual) },
  { label: "UUID", value: data.value.uuid },
  { label: "虚拟主机", value: data.value.virtualHost },
  { label: "树莓", value: data.value.raspberrry },
];
</script>
<template>
  <div class="details">
    <h2>系统</h2>
    <ul>
      <template v-for="list in dataLists" :key="list.value">
        <li v-if="list.value && list.value !== ''">
          <span>{{ list.label }}</span>
          <span>{{ list.value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>
<style scoped lang="less"></style>

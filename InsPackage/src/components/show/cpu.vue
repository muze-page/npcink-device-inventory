<script setup lang="ts">
//https://systeminformation.io/cpu.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { formatBytes, judge_bool } from "@/components/state/tool";

const data = computed(() => {
  return deviceData.value.cpu;
});

const cacheLabels = {
  l1d: "L1数据",
  l1i: "L1指令",
  l2: "L2缓存",
  l3: "L3缓存",
};

// CPU信息的数组
const cpuItems = [
  { label: "制造者", value: data.value.manufacturer },
  { label: "品牌", value: data.value.brand },
  { label: "速度", value: data.value.speed },
  { label: "速度最小值", value: data.value.speedMin },
  { label: "速度最大值", value: data.value.speedMax },
  { label: "总督", value: data.value.governor },
  { label: "核心", value: data.value.cores },
  { label: "物理核心", value: data.value.physicalCores },
  { label: "性能核心", value: data.value.performanceCores },
  { label: "效率核心", value: data.value.efficiencyCores },
  { label: "处理器", value: data.value.processors },
  { label: "插座类型", value: data.value.socket },
  { label: "供应商", value: data.value.vendor },
  { label: "系列", value: data.value.family },
  { label: "型号", value: data.value.model },
  { label: "步进", value: data.value.stepping },
  { label: "校订", value: data.value.revision },
  { label: "电压", value: data.value.voltage },
  { label: "处理器标志", value: data.value.flags },
  { label: "虚拟化", value: judge_bool(data.value.virtualization) },
];

// CPU缓存信息的数组
const cacheItems = Object.entries(data.value.cache).map(([key, value]) => {
  return {
    label: cacheLabels[key],
    value: formatBytes(value),
  };
});
</script>

<template>
  <div class="details">
    <h2>CPU</h2>
    <ul>
      <template v-for="item in cpuItems" :key="item.label">
        <li v-if="item.value && item.value !== ''">
          <span>{{ item.label }}</span>
          <span>{{ item.value }}</span>
        </li>
      </template>

      <template v-for="item in cacheItems" :key="item.label">
        <li v-if="item.value && item.value !== ''">
          <span>{{ item.label }}</span>
          <span>{{ item.value }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped lang="less"></style>

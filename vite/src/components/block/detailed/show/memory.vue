<script setup lang="ts">
//内存
//https://systeminformation.io/memory.html
import {  computed } from "vue";
import deviceData from "@/components/state/data";
import { formatBytes, judge_bool } from "@/components/state/tool";

const data = computed(() => {
  return deviceData.value.memLayout;
});

const formattedData = data.value.map((data:any) => [
  { label: "大小", value: formatBytes(data.size, "g") },
  { label: "内存库", value: data.bank },
  { label: "内存类型", value: data.type },
  { label: "ECC内存", value: judge_bool(data.ecc) },
  { label: "时钟速度", value: data.clockSpeed },
  { label: "外形尺寸", value: data.formFactor },
  { label: "制造者", value: data.manufacturer },
  { label: "部件号", value: data.partNum },
  { label: "序号", value: data.serialNum },
  { label: "电压已配置", value: data.voltageConfigured },
  { label: "最小电压", value: data.voltageMin },
  { label: "最大电压", value: data.voltageMax },
]);
</script>
<template>
  <div class="details">
    <h2>内存</h2>
    <template v-for="(item, index) in formattedData" :key="item.label">
      <h3>内存条{{ index + 1 }}</h3>
      <ul>
        <template v-for="list in item" :key="list.value">
          <li v-if="list.value && list.value !== ''">
            <span>{{ list.label }}</span>
            <span>{{ list.value }}</span>
          </li>
        </template>
      </ul>
    </template>
  </div>
</template>
<style scoped lang="less"></style>

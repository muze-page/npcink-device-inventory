<script setup lang="ts">
//显卡
//https://systeminformation.io/graphics.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { judge_bool } from "@/components/state/tool";

const data = computed(() => {
  return deviceData.value.graphics;
});

const dataLists = data.value.controllers.map((data:any) => [
  { label: "供应商", value: data.vendor },
  { label: "型号", value: data.model },
  { label: "总线", value: data.bus },
  { label: "显存", value: data.vram },
  { label: "动态分配", value: judge_bool(data.vramDynamic) },
  { label: "GPU内核", value: data.cores },
  { label: "设备标识", value: data.deviceId },
  { label: "外部GPU", value: judge_bool(data.external) },
  { label: "金属版本", value: data.metalVersion },
  { label: "供应商编号", value: data.vendorId },
]);
</script>
<template>
  <div class="details">
    <template v-for="(item, index) in dataLists" :key="item.label">
      <h3>显卡 - {{ index + 1 }}</h3>
      <ul>
        <template v-for="list in item" :key="list.value">
          <li v-if="list.value && list.value !== ''">
            <span>{{ list.label }}</span>
            <span>{{ list.value }}</span>
          </li>
        </template>
      </ul>
    </template>

    <!--
        TODO:很多属性未完成
        子供应商{{item.subVendor}}
    {{item.pciId}}
    -->
  </div>
</template>
<style scoped lang="less"></style>

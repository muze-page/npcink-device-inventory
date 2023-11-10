<script setup lang="ts">
//显示器
//https://systeminformation.io/graphics.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { judge_bool } from "@/components/state/tool";
const data = computed(() => {
  return deviceData.value.graphics;
});

const formattedData = data.value.displays.map((data: any) => [
  { label: "供应商", value: data.vendor },
  { label: "供应商编号", value: data.vendorId },
  { label: "型号", value: data.model },
  { label: "生产年份", value: data.productionYear },
  { label: "序列号", value: data.serial },
  { label: "显示ID", value: data.displayId },
  { label: "主显示器", value: judge_bool(data.main) },
  { label: "内置显示器", value: judge_bool(data.builtin) },
  { label: "链接类型", value: data.connection },
  { label: "尺寸", value: `${data.sizeX} x ${data.sizeY} 毫米` },
  { label: "颜色深度（位）", value: `${data.pixelDepth} 位` },
  { label: "分辨率", value: `${data.resolutionX} x ${data.resolutionY} 像素` },
  { label: "位置", value: `(${data.positionX}, ${data.positionY})` },
  { label: "刷新率", value: `${data.currentRefreshRate} 赫兹` },
  { label: "设备名称", value: data.deviceName },
]);
</script>
<template>
  <div class="details">
   
    <template v-for="(item, index) in formattedData" :key="item.label">
      <h3>显示器{{ index + 1 }}</h3>
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

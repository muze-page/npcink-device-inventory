<script setup lang="ts">
// 硬盘 - 已检查
// https://systeminformation.io/filesystem.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { formatBytes } from "@/components/state/tool";

const data = computed(() => deviceData.value.diskLayout);

const formattedData = data.value.map((data: any) => [
  { label: "设备", value: data.device },
  { label: "类型", value: data.type },
  { label: "名称", value: data.name },
  { label: "供应商", value: data.vendor },
  { label: "容量", value: formatBytes(data.size, "g") },
  { label: "总气缸数", value: data.totalCylinders },
  { label: "总头数", value: data.totalHeads },
  { label: "总曲目数", value: data.totalTracks },
  { label: "总扇区", value: data.totalSectors },
  { label: "每缸轨道数", value: data.tracksPerCylinder },
  { label: "每轨扇区数", value: data.sectorsPerTrack },
  { label: "每个扇区字节数", value: data.bytesPerSector },
  { label: "固件修订版本", value: data.firmwareRevision },
  { label: "序列号", value: data.serialNum },
  { label: "接口类型", value: data.interfaceType },
  { label: "智能状态", value: data.smartStatus },
  { label: "温度", value: data.temperature },
  { label: "智能数据", value: data.smartData },
]);
</script>

<template>
  <div class="details">
    <h2>硬盘</h2>
    <template v-for="(item, index) in formattedData" :key="item.label">
      <h3>硬盘{{ index + 1 }}</h3>
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

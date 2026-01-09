<script setup lang="ts">
//OS
//https://systeminformation.io/os.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { judge_bool } from "@/components/state/tool";
const data = computed(() => {
  return deviceData.value.os;
});
const dataLists = [
  { label: "平台", value: data.value.platform },
  { label: "发行版", value: data.value.distro },
  { label: "版本号", value: data.value.release },
  { label: "代号", value: data.value.codename },
  { label: "内核", value: data.value.kernel },
  { label: "架构", value: data.value.arch },
  { label: "主机名", value: data.value.hostname },
  { label: "完全限定域名", value: data.value.fqdn },
  { label: "操作系统内部版本", value: data.value.codepage },
  { label: "徽标文件", value: data.value.logofile },
  { label: "系统内部版本", value: data.value.build },
  { label: "服务包版本", value: data.value.servicepack },
  { label: "UEFI启动", value: judge_bool(data.value.uefi) },
  { label: "系统序列号", value: data.value.serial },
  { label: "Hyper-V", value: data.value.hypervisor },
  { label: "远程会话", value: data.value.remoteSession },
];
</script>

<template>
  <div class="details">
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

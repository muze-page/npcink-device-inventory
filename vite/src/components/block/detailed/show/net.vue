<script setup lang="ts">
//NET
//https://systeminformation.io/network.html
import { computed } from "vue";
import deviceData from "@/components/state/data";
import { judge_bool } from "@/components/state/tool";
const data = computed(() => {
  return deviceData.value.net;
});

const formattedData = data.value.map((data: any) => [
  { label: "接口名", value: data.ifaceName },
  { label: "默认接口", value: judge_bool(data.default) },
  { label: "IPV4", value: data.ip4 },
  { label: "IPV4子网掩码", value: data.ip4subnet },
  { label: "IPV6", value: data.ip6 },
  { label: "IPV6子网掩码", value: data.ip6subnet },
  { label: "MAC地址", value: data.mac },
  { label: "内部接口", value: judge_bool(data.internal) },
  { label: "虚拟接口", value: judge_bool(data.virtual) },
  { label: "操作状态", value: judge_bool(data.operstate) },
  { label: "类型", value: data.type },
  { label: "双工", value: data.duplex },
  { label: "MTU最大传输单元", value: data.mtu },
  { label: "速度", value: data.speed },
  { label: "通过DHCP获取的地址", value: judge_bool(data.dhcp) },
  { label: "DNS后缀", value: data.dnsSuffix },
  { label: "IEEE 802.1x身份验证", value: data.ieee8021xAuth },
  { label: "IEEE 802.1x状态", value: data.ieee8021xState },
  { label: "运营商变更", value: data.carrierChanges },
]);
</script>
<template>
  <div class="details">
    <template v-for="(item, index) in formattedData" :key="item.label">
      <h3>网卡 - {{ index + 1 }}</h3>
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

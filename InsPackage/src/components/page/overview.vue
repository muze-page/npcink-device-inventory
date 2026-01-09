<script setup lang="ts">
//概览
import { ref, watchEffect, computed } from "vue";
import deviceData from "@/components/state/data";
import { formatBytes } from "@/components/state/tool";

const data = ref();
watchEffect(() => {
  if (deviceData.value) {
    data.value = deviceData.value;
  }
});

/**
 * 姓名
 */
const name = computed(() => {
  //从本地拿
  const data = localStorage.getItem("name");
  if (data) {
    return data;
  }
});

/**
 * 编码
 */
const styleNumber = computed(() => {
  //从本地拿
  const data = localStorage.getItem("styleNumber");
  if (data) {
    return data;
  }
});

//计算总内存
const sumMemory = computed(() => {
  const sumData = data.value.memLayout.reduce((acc, obj) => acc + obj.size, 0);
  //第一根内存条的类型
  const type = data.value.memLayout[0].type;
  return `${type} ${formatBytes(sumData, "g")}`;
});

//计算总硬盘
const sumDisk = computed(() => {
  const sumData = data.value.diskLayout.reduce((acc, obj) => acc + obj.size, 0);
  return formatBytes(sumData, "g");
});

//计算显示器 - 第一个显示器
const sumGraphics = computed(() => {
  const display = data.value.graphics.displays[0];
  const { productionYear, model, resolutionX, resolutionY } = display;
  return `<h3>${productionYear} ${model}</h3><small>（${resolutionX}x${resolutionY}像素）</small>`;
});

//计算显卡 - 第一张显卡
const sumControllers = computed(() => {
  const display = data.value.graphics.controllers[0];
  const { vendor, model, vram } = display;
  return `${vendor} ${model} ${formatBytes(vram, "g")}`;
});
</script>
<template>
  <div v-if="false">
    姓名、编号、处理器、内存、显卡、主板、主硬盘、主显示器 网卡、电池、声卡
  </div>

  <div class="box" v-if="data">
    <div class="content">
      <div class="content-child">
        <div class="style">
          <span>姓名</span>

          <h3>{{ name ?? "未设定" }}</h3>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>硬盘</span>

          <h3>
            {{ sumDisk }}
          </h3>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>内存</span>

          <h3>
            {{ sumMemory }}
          </h3>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>显卡</span>

          <h3>
            {{ sumControllers }}
          </h3>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>编号</span>
          <br />
          <small>序列号：{{ data.uuid.hardware }}</small>
          <br />
          <small v-if="styleNumber">编号：{{ styleNumber }}</small>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>处理器</span>

          <h3>{{ data.cpu.manufacturer }} {{ data.cpu.brand }}</h3>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>主板</span>

          <h3>{{ data.baseboard.manufacturer }} {{ data.baseboard.model }}</h3>

          <small v-if="false"
            >（最大内存：{{ formatBytes(data.baseboard.memMax, "g") }}+
            拓展插槽： {{ data.baseboard.memSlots }}）</small
          >
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>系统</span>

          <h3>{{ data.os.distro }} {{ data.os.release }}</h3>
          <small>({{ data.os.build }})</small>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>显示器</span>

          <div v-html="sumGraphics"></div>
        </div>
      </div>
      <div class="content-child">
        <div class="style">
          <span>OS</span>

          <h3>{{ data.os.codename }}</h3>
          <small>({{ data.os.release }})</small>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="less">
.content {
  display: grid;
  /*设置行与行,列与列的间隔*/
  grid-gap: 10px;
  /*四列列宽*/
  grid-template-columns: 100px 1fr 3fr 2fr;
  /*三横宽*/
  grid-template-rows: 100px 200px 100px;
  /*先行后列排序*/
  grid-auto-flow: row dense;

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    background-color: #444;
    color: #fff;
    border-radius: 18px;

    background: rgba(255, 255, 255, 0.08);
    flex-wrap: wrap;
  }
  .content-child {
    text-align: center;
  }
  .content-child:nth-child(3) {
    grid-column: 1 / span 2;
  }
  .content-child:nth-child(8) {
    grid-column: 1 / span 2;
  }
}
.style {
  h2,
  h3,
  h4,
  h5 {
    margin: 6px 0;
  }
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5) {
    margin: 6px 0;
  }
}
</style>

<script setup lang="ts">
//表格内容
import { ref, computed } from "vue";


import MonitorPng from "@/assets/monitor.svg";
import MemoryPng from "@/assets/memory.svg";
import GraphicsPng from "@/assets/graphics.svg";
import BatteryPng from "@/assets/battery.svg";

import CpuPng from "@/assets/cpu.svg";
import DiskPng from "@/assets/disk.svg";
import NetPng from "@/assets/net.svg";
import BiosPng from "@/assets/bios.svg";
import ChassisPng from "@/assets/chassis.svg";
import BaseboardPng from "@/assets/baseboard.svg";
import OsPng from "@/assets/os.svg";
import SystemPng from "@/assets/system.svg";
import AboutPng from "@/assets/about.svg";

//选中的ID
const activeTab = ref(1);

//切换方法
const changeTab = (index: number) => {
  activeTab.value = index;
};

//准备数据
const data = ref([
  {
    id: 1,
    ico: CpuPng,
    title: "处理器",
    content: "CPU 是核心部件，决定了大部分电脑性能",
  },
  { id: 2, ico: MemoryPng, title: "内存", content: "简简单单的内存" },
  { id: 3, ico: GraphicsPng, title: "显卡", content: "让游戏玩的更爽快" },
  { id: 4, ico: BaseboardPng, title: "主板", content: "电脑的地基" },
  { id: 5, ico: MonitorPng, title: "显示器", content: "简简单单的显示器" },
  { id: 6, ico: DiskPng, title: "硬盘", content: "简简单单的硬盘" },
  { id: 7, ico: NetPng, title: "网卡", content: "简简单单的BIOS" },
  { id: 8, ico: BatteryPng, title: "电池", content: "简简单单的BIOS" },

  { id: 9, ico: BiosPng, title: "BIOS", content: "简简单单的BIOS" },
  { id: 10, ico: ChassisPng, title: "机箱", content: "简简单单的机箱" },
  { id: 11, ico: OsPng, title: "OS", content: "简简单单的其他" },
  { id: 12, ico: SystemPng, title: "系统", content: "简简单单的其他" },
  { id: 13, ico: AboutPng, title: "其他", content: "简简单单的其他" },
]);




</script>
<template>
  <div class="lifeDailyInfoGridContainer-DS-EntryPoint1-1">
    <!--左边-->
    <div class="lifeDailyInfoContainer">
      <button
        class="lifeIndexBarWrapper-DS-EntryPoint1-1"
        v-for="(item, index) in data"
        :key="index"
        @click="changeTab(item.id)"
        :class="{ active: item.id === activeTab }"
      >
        <!--图标-->
        <div class="lifeIndexBarIconContainer-DS-EntryPoint1-1">
          <img :src="item.ico" />
        </div>
        <!--内容-->
        <div class="lifeIndexBarTextContainer-DS-EntryPoint1-1">
          <div
            class="lifeIndexBarTitle-DS-EntryPoint1-1 textEllipsis-DS-EntryPoint1-1"
          >
            {{ item.title }}
          </div>
          <div class="lifeIndexBarSummary-DS-EntryPoint1-1">
            <span
              class="lifeIndexBarLevelText-DS-EntryPoint1-1 textEllipsis-DS-EntryPoint1-1"
            >
              正常
            </span>
            <span
              class="lifeIndexItemLevelCircle-DS-EntryPoint1-1"
              :style="{ background: 'rgb(59, 226, 59)' }"
            >
            </span>
          </div>
        </div>
      </button>
      到底啦
    </div>
    <!--右边-->
    <div class="lifeDayHourPanel-DS-EntryPoint1-1">
      <div class="WeatherLifeDayHourPanelRoot-DS-EntryPoint1-1">
        <div class="wDailyInfoSection-DS-EntryPoint1-1">
          <div
            v-for="(tab, index) in data"
            :key="index"
            v-show="activeTab === tab.id"
          >
            <!--顶部-->
            <div class="wDailyTitleSection-DS-EntryPoint1-1">
              <div class="wDailyTitleSection_Line1-DS-EntryPoint1-1">
                <!--图标-->
                <div class="wDailyTitleSection_icon-DS-EntryPoint1-1">
                  <img :src="tab.ico" />
                </div>
                <!--名称-->
                <div class="wDailyTitleSection_title-DS-EntryPoint1-1">
                  {{ tab.title }}
                </div>
                <!--详细解释-->
              </div>
            </div>
            <!--文字-->
            <div class="wDailyOverlapSection-DS-EntryPoint1-1">
              <div class="wDailyTipsSection-DS-EntryPoint1-1">
                <div class="wDailyTipsSection_desc-DS-EntryPoint1-1">
                  {{ tab.content ?? "待完善" }}
                </div>
              </div>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="less">
.lifeDailyInfoGridContainer-DS-EntryPoint1-1 {
  display: grid;
  grid-template-columns: auto auto;
  grid-column-gap: 0px;
  z-index: 1;
}
//按钮
.lifeDailyInfoContainer {
   height: 368px;
  padding-right: 12px;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
}
.lifeDailyInfoGridContainer-DS-EntryPoint1-1 .lifeDailyInfoContainer {
  display: flex;
  flex-direction: column;
}

//按钮 内容
.lifeIndexBarWrapper-DS-EntryPoint1-1 {
  display: flex;
  position: relative;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  padding: 10.33px 12px 10.33px 7px;
  flex-direction: row;
  align-items: center;
  z-index: 2;
  border: 2px solid transparent;
  //左边
  .lifeIndexBarIconContainer-DS-EntryPoint1-1 {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.2);
    width: 30px;
    height: 30px;
    border-radius: 30px;
    fill: none;
    color: #ffffff;
  }
  //右边
  .lifeIndexBarTextContainer-DS-EntryPoint1-1 {
    display: flex;
    flex-grow: 1;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .lifeIndexBarTitle-DS-EntryPoint1-1 {
      flex: 0 1 auto;
      color: #ffffff;
      margin-left: 8px;
      text-align: left;
      font-family: Segoe UI, Segoe WP, Arial, Sans-Serif;
      font-weight: 600;
      font-size: 13px;
      line-height: 18px;
      text-transform: capitalize;
    }
    .lifeIndexBarSummary-DS-EntryPoint1-1 {
      width: 40px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      flex: 1 0 auto;
      margin-left: 8px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      font-weight: 400;
    }

    .lifeIndexBarLevelText-DS-EntryPoint1-1 {
      text-align: right;
    }
    .lifeIndexItemLevelCircle-DS-EntryPoint1-1 {
      margin-left: 6px;
      width: 8px;
      height: 8px;
      border-radius: 8px;
    }
  }
}

//右边
.lifeDayHourPanel-DS-EntryPoint1-1 {
  z-index: 1;
  .WeatherLifeDayHourPanelRoot-DS-EntryPoint1-1 {
    background: rgba(255, 255, 255, 0.08);
    position: relative;
    box-sizing: border-box;
    height: 368px;
    
    padding: 16px 20px;
    border-radius: 12px;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    text-align: left;
    color: #ffffff;
    z-index: 2;
    outline: 1px solid transparent;
    overflow: visible;
    .wDailyInfoSection-DS-EntryPoint1-1 {
      height: 100%;
    }
  }
}

//右边 - 顶部
.wDailyTitleSection-DS-EntryPoint1-1 {
  border-bottom: 1px dashed rgba(255, 255, 255, 0.25);
  padding-bottom: 6px;
  .wDailyTitleSection_Line1-DS-EntryPoint1-1 {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 3px;
    //图标
    .wDailyTitleSection_icon-DS-EntryPoint1-1 {
      padding: 8px;
      width: 40px;
      height: 40px;
      fill: none;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 100px;
      //display: inline-block;
      box-sizing: border-box;
      margin-right: 8px;
      color: #ffffff;

      display: flex;
      align-items: center;
      justify-content: center;
    }
    //文本
    .wDailyTitleSection_title-DS-EntryPoint1-1 {
      font-size: 16px;
      line-height: 21px;
      opacity: 0.8;
      text-transform: capitalize;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

//描述
.wDailyOverlapSection-DS-EntryPoint1-1 {
  margin-bottom: 10px;
  overflow-y: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;

  .wDailyTipsSection-DS-EntryPoint1-1 {
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
    padding: 4px 0;
    .wDailyTipsSection_desc-DS-EntryPoint1-1 {
      line-height: 18px;
      opacity: 0.8;
    }
  }
}

//选中
.lifeIndexBarWrapper-DS-EntryPoint1-1:not(:first-child) {
  margin-top: 8px;
}
.lifeIndexBarWrapper-DS-EntryPoint1-1 {
  background: rgba(255, 255, 255, 0.03);
}
.lifeIndexBarWrapper-DS-EntryPoint1-1.active {
  background: rgba(255, 255, 255, 0.08);
}
.textEllipsis-DS-EntryPoint1-1 {
  overflow: hidden;
  white-space: nowrap;
  word-break: keep-all;
  text-overflow: ellipsis;
}

@media (min-width: 1304px) {
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 .lifeDailyInfoContainer {
    width: 246px;
    z-index: 1;
  }
  .lifeIndexBarTitle-DS-EntryPoint1-1 {
    max-width: 81px;
  }
  .lifeDayHourPanel-DS-EntryPoint1-1 {
    width: 627px;
  }
  .WeatherLifeDayHourPanelRoot-DS-EntryPoint1-1 {
    width: 627px;
  }
  .wDailyTitleSection_title-DS-EntryPoint1-1 {
    max-width: 300px;
  }
}

@media (min-width: 980px) and (max-width: 1303px) {
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 .lifeDailyInfoContainer {
    width: 192px;
    z-index: 1;
  }
  .lifeIndexBarTitle-DS-EntryPoint1-1 {
    max-width: 77px;
  }
  .lifeDayHourPanel-DS-EntryPoint1-1 {
    width: 374px;
  }
  .WeatherLifeDayHourPanelRoot-DS-EntryPoint1-1 {
    width: 374px;
  }
  .wDailyTitleSection_title-DS-EntryPoint1-1 {
    max-width: 150px;
  }
}
@media (max-width: 979px) {
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 .lifeDailyInfoContainer {
    width: 192px;
    z-index: 1;
  }
  .lifeIndexBarTitle-DS-EntryPoint1-1 {
    max-width: 77px;
  }
  .lifeDayHourPanel-DS-EntryPoint1-1 {
    width: 374px;
  }
  .WeatherLifeDayHourPanelRoot-DS-EntryPoint1-1 {
    width: 374px;
  }
  .wDailyTitleSection_title-DS-EntryPoint1-1 {
    max-width: 150px;
  }
  .wDailyTipsSection_desc-DS-EntryPoint1-1 {
    line-height: 17px;
  }
}
.wDailyOverlapSection-DS-EntryPoint1-1 :deep(h2) {
  display: none;
}

img {
  width: 16px;
  height: 16px;
}
</style>

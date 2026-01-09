<script setup lang="ts">
import { ref } from "vue";

import Overview from "@/components/theme/overview.vue";
import Details from "@/components/theme/details.vue";
import Right from "@/assets/tool/right.svg";
//选项
const activeTab = ref(0);
//列表
const tabs = [
  { title: "概览", component: Overview },
  { title: "详情", component: Details },
];
//切换
const changeTab = (index: number) => {
  activeTab.value = index;
};
</script>
<template>
  <div class="box_tab">
    <div class="weatherLifeCurrentV2_root-DS-EntryPoint1-1">
      <!--列表-->
      <div class="lifeTitleContainer-DS-EntryPoint1-1">
        <div class="lifeTopicLabelContainer-DS-EntryPoint1-1">
          <button
            v-for="(tab, index) in tabs"
            :key="index"
            class="lifeTopicLabelButton-DS-EntryPoint1-1"
            :class="{ lifeTopicLabelSelected: activeTab === index }"
            @click="changeTab(index)"
          >
            {{ tab.title }}
          </button>
        </div>
        <a href="#" class="seeMoreForecast-DS-EntryPoint1-1">
          <span class="seeMoreForecastText-DS-EntryPoint1-1">
            下载完整信息  <img :src="Right" />
          </span>
        </a>
      </div>
      <!--内容-->
      <component :is="tabs[activeTab].component" />
    </div>
  </div>
</template>
<style scoped lang="less">
.box_tab {
  grid-area: 2 / 1 / 4 / 3;
  padding-top: 0px;
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 {
    position: relative;
    margin: 0 auto;
    box-sizing: border-box;
    height: 466px;

    background: rgba(255, 255, 255, 0.08);
    background-size: 380px 376px;
    background-repeat: no-repeat;
    background-position: top right;
    backdrop-filter: blur(60px);
    border-radius: 6px;
    padding: 14px 20px 20px 20px;
    color: #ffffff;
    z-index: 1;
  }
}

//列表
.lifeTitleContainer-DS-EntryPoint1-1 {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
  //左边
  .lifeTopicLabelContainer-DS-EntryPoint1-1 {
    flex: 1 0 auto;
    z-index: 2;
    .lifeTopicLabelButton-DS-EntryPoint1-1 {
      font-family: Segoe UI;
      font-size: 18px;
      line-height: 24px;
      color: rgba(255, 255, 255, 0.8);
      margin: 2px 20px 2px 0px;
      padding: 0px;
      background: none;
      border: none;
      cursor: pointer;
    }
    .lifeTopicLabelSelected {
      font-weight: 600;
      color: #ffffff;
      border-bottom: 2px solid rgba(255, 255, 255, 0.8);
    }
  }
  //右边
  .seeMoreForecast-DS-EntryPoint1-1 {
    z-index: 2;
    flex: 0 1 auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 12px 6px 12px;
    border-radius: 20px;
    color: #fff;
    text-decoration: none;
    .seeMoreForecastText-DS-EntryPoint1-1 {
      margin-right: 7px;
      font-weight: 400;
      font-size: 14px;
      line-height: 19px;
    }
    a {
      color: #fff;
      text-decoration: none;
    }
  }
  .seeMoreForecast-DS-EntryPoint1-1:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}
//内容

@media (min-width: 1304px) {
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 {
    width: 925px;
  }
}
@media (min-width: 980px) and (max-width: 1303px) {
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 {
    width: 612px;
  }
}
@media (max-width: 979px) {
  .box_tab {
    grid-area: 2 / 1 / 3 / 3;
  }
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 {
    width: 612px;
  }
}

//自定义
.box_tab {
  grid-area: auto;
  .weatherLifeCurrentV2_root-DS-EntryPoint1-1 {
    margin: inherit;
  }
}
</style>

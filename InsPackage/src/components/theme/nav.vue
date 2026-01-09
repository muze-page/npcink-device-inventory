<script setup lang="ts">
//导航
import Right from "@/assets/tool/right.svg";
</script>
<template>
  <div class="nav_box">
    <div class="weatherForecastTabRoot-DS-EntryPoint1-1">
      <!--顶部-->
      <div class="location_name_container-DS-EntryPoint1-1">
        <a
          href="#"
          class="location_name_label-DS-EntryPoint1-1 location_name_link-DS-EntryPoint1-1"
        >
          简简单单的内容
        </a>
      </div>
      <!--导航-->
      <div class="wDailyTabSection-DS-EntryPoint1-1">
        <!--左边按钮-->
        <button
          class="wChevron-DS-EntryPoint1-1 wChevron__left-DS-EntryPoint1-1"
        >
          <span :style="{ transform: 'rotate(180deg)' }">
            <img :src="Right" />
          </span>
        </button>
        <div class="wDailyTabCarousel-DS-EntryPoint1-1">
          <ul class="wDailyTabContainer-DS-EntryPoint1-1 scrollToLeft">
            <li
              class="wDailyTabContent-DS-EntryPoint1-1"
              v-for="(_item, index) in 10"
              :key="index"
              :class="{
                wpDailySelected: index === 0,
              }"
            >
              <button class="wDailyTabItem-DS-EntryPoint1-1">
                <div class="wDailyTabItemContent-DS-EntryPoint1-1">
                  <div class="wDailyTabWeatherCondition-DS-EntryPoint1-1">
                    <div class="wDailyTabDayText-DS-EntryPoint1-1">今天</div>
                  </div>
                  <div class="wDailyTabWeatherCondition-DS-EntryPoint1-1">
                    ☀️
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </div>
        <!--右边边按钮-->
        <button
          class="wChevron-DS-EntryPoint1-1 wChevron__right-DS-EntryPoint1-1"
        >
          <span>
            <img :src="Right" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
<style scoped lang="less">
.nav_box {
  grid-area: 1 / 1 / 2 / 4;
  padding-top: 0px;
  .weatherForecastTabRoot-DS-EntryPoint1-1 {
    position: relative;
    box-sizing: border-box;
    //顶部
    .location_name_container-DS-EntryPoint1-1 {
      display: flex;
      height: 24px;
      position: relative;
      align-items: center;
      max-width: 612px;
      .location_name_label-DS-EntryPoint1-1 {
        color: #fff;
        line-height: 24px;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }
      .location_name_link-DS-EntryPoint1-1 {
        cursor: inherit;
      }
    }
    //导航
    .wDailyTabSection-DS-EntryPoint1-1 {
      position: relative;
      margin-top: 16px;
      .wDailyTabCarousel-DS-EntryPoint1-1 {
        overflow: hidden;
        .wDailyTabContainer-DS-EntryPoint1-1 {
          position: relative;
          margin: 0;
          padding: 0;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding-top: 2px;
          padding-bottom: 14px;
          transition: 1s;
          .wDailyTabContent-DS-EntryPoint1-1 {
            display: inline-block;
            list-style: none;
            list-style-type: none;
            padding: 0;
            margin: 0;
            width: 108px;
            flex-grow: 0;
            flex-shrink: 0;
            margin-right: 8px;
          }
          .wDailyTabContent-DS-EntryPoint1-1.wpDailySelected {
            width: 192px;
          }
        }
      }
    }
  }
}

//按钮
.wDailyTabItem-DS-EntryPoint1-1 {
  position: relative;
  height: 48px;
  width: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  .wDailyTabItemContent-DS-EntryPoint1-1 {
    height: 48px;
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(50px);
    border-radius: 6px;
    display: flex;
    padding: 14px 10px;
    box-sizing: border-box;
    justify-content: space-between;
    .wDailyTabWeatherCondition-DS-EntryPoint1-1 {
      display: flex;
      align-items: center;
      .wDailyTabDayText-DS-EntryPoint1-1 {
        font-size: 14px;
        line-height: 20px;
        text-transform: capitalize;
      }
    }
  }
  .wDailyTabItemContent-DS-EntryPoint1-1:hover {
    background: rgba(255, 255, 255, 0.04);
  }
  .wpDailySelected .wDailyTabItemContent-DS-EntryPoint1-1 {
    color: rgba(255, 255, 255, 1);
  }
  .wpDailySelected .wDailyTabDayText-DS-EntryPoint1-1 {
    padding-right: 10px;
  }
}

//切换按钮
.wChevron-DS-EntryPoint1-1 {
  position: absolute;
  top: 14px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: rgba(216, 232, 255, 0.08);
  backdrop-filter: blur(50px);
  border: none;
  font-size: 1rem;
  width: 24px;
  height: 24px;
  transform: rotate(0deg);
  border-radius: 100%;
}
.wChevron-DS-EntryPoint1-1 > span:nth-child(1) {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  outline: none;
}
.wChevron__left-DS-EntryPoint1-1 {
  left: -12px;
}
.wChevron__right-DS-EntryPoint1-1 {
  right: -12px;
}

@media (min-width: 1304px) {
  .weatherForecastTabRoot-DS-EntryPoint1-1 {
    width: 1236px;
  }
  .wDailyTabContainer-DS-EntryPoint1-1 {
    transform: translateX(0) !important;
  }
}

@media (min-width: 980px) and (max-width: 1303px) {
  .weatherForecastTabRoot-DS-EntryPoint1-1 {
    width: 924px;
  }
  .wDailyTabContainer-DS-EntryPoint1-1.scrollToLeft {
    transform: translateX(0);
  }
}
@media (max-width: 979px) {
  .nav_box {
    grid-area: 1 / 1 / 2 / 3;
  }
  .weatherForecastTabRoot-DS-EntryPoint1-1 {
    width: 612px;
  }
}
@media (min-width: 656px) and (max-width: 979px) {
  .wDailyTabContainer-DS-EntryPoint1-1.scrollToLeft {
    transform: translateX(0);
  }
}
</style>

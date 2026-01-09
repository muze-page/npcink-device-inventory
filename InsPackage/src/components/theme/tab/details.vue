<script setup lang="ts">
//详情
import Right from "@/assets/tool/right.svg";
</script>
<template>
  <div class="box_details">
    <div class="weatherLifeSpecialToday_root_v2-DS-EntryPoint1-1">
      <div class="wxlSft_section-DS-EntryPoint1-1">
        <div class="wxlSft_content-DS-EntryPoint1-1">
          <div class="wxlSft_st_section_v2-DS-EntryPoint1-1">
            <!--右-->
            <div class="wxlSft_st_seeCalendar-DS-EntryPoint1-1">
              <a href="#" class="wxlSft_st_seeCalendarLink-DS-EntryPoint1-1">
                查看更多
                <img :src="Right" />
              </a>
            </div>
            <!--左-->
            <div class="wxlSft_st_title_section-DS-EntryPoint1-1">
              <div class="wxlSft_st_title-DS-EntryPoint1-1">设备解释</div>
            </div>
            <!--下-->
            <div class="wxlSft_st_todayInfo_v2-DS-EntryPoint1-1">
              七七八八的内容
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="less">
.box_details {
  grid-area: 2 / 3 / 3 / 4;
  padding-top: 0px;
}
.weatherLifeSpecialToday_root_v2-DS-EntryPoint1-1 {
  margin: 0 auto;
  position: relative;
  width: 300px;
  height: 267px;
  box-sizing: border-box;
  .wxlSft_section-DS-EntryPoint1-1 {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    .wxlSft_content-DS-EntryPoint1-1 {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: block;
    }
  }
}
.wxlSft_st_section_v2-DS-EntryPoint1-1 {
  position: relative;
  width: 300px;
  height: 267px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(60px);
  border-radius: 6px;
  padding: 12px 16px 16px 16px;
  box-sizing: border-box;
}

//右
.wxlSft_st_seeCalendar-DS-EntryPoint1-1 {
  position: absolute;
  top: 0;
  right: 0;
  margin: 12px 20px;
  display: flex;
  align-items: center;
  z-index: 1;
  .wxlSft_st_seeCalendarLink-DS-EntryPoint1-1 {
    color: #ffffff;
    margin: 0 6px;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
  }
}
//左
.wxlSft_st_title_section-DS-EntryPoint1-1 {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  .wxlSft_st_title-DS-EntryPoint1-1 {
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: #ffffff;
  }
}
//中
.wxlSft_st_todayInfo_v2-DS-EntryPoint1-1 {
  position: relative;
  padding-top: 12px;
  box-sizing: border-box;
}

@media (min-width: 1304px) {
  .wxlSft_content-DS-EntryPoint1-1 {
    display: block;
  }
  .wxlSft_st_section_v2-DS-EntryPoint1-1 {
    position: absolute;
    right: 0;
    top: 0;
  }
}

@media (min-width: 980px) and (max-width: 1303px) {
  .weatherLifeSpecialToday_root_v2-DS-EntryPoint1-1 {
    width: 300px;
    height: 267px;
  }
  .wxlSft_content-DS-EntryPoint1-1 {
    display: flex;
    flex-direction: row;
  }
  .wxlSft_st_section_v2-DS-EntryPoint1-1 {
    position: absolute;
    right: 0;
    top: 0;
  }
}
@media (max-width: 979px) {
  .box_details {
    grid-area: 3 / 2 / 4 / 2;
  }
  .weatherLifeSpecialToday_root_v2-DS-EntryPoint1-1 {
    width: 612px;
    height: 304px;
  }
  .wxlSft_content-DS-EntryPoint1-1 {
    display: block;
  }
  .wxlSft_st_section_v2-DS-EntryPoint1-1 {
    // position: absolute;
    position: sticky;

    right: 0;
    top: 0;
    height: 304px;
  }
}
</style>

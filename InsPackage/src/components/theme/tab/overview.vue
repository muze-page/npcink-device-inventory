<script setup lang="ts">
//概览
</script>
<template>
  <div class="overview_box">
    <div class="weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 wxl_quizZhCn">
      <!--第一部分-->
      <div class="wxlqc_section-DS-EntryPoint1-1">
        <div class="wxlqc_content-DS-EntryPoint1-1">
          <!--标题-->
          <div class="wxlqc_titleSection-DS-EntryPoint1-1">
            <div class="wxlqc_titleText-DS-EntryPoint1-1">简单补充</div>
          </div>
          <!--内容-->
          <div class="wxlqc_todayQuizSection-DS-EntryPoint1-1">
            <div class="wxlqc_tqScroll-DS-EntryPoint1-1">
              <div class="wxlqc_tqQuestion-DS-EntryPoint1-1">
                简简单单的内容
              </div>
            </div>
          </div>
        </div>
      </div>
      <!--第二部分-->
      <div class="wxlSft_st_doable_section_v2-DS-EntryPoint1-1">
        <div class="wxlSft_st_doable_content-DS-EntryPoint1-1">
          <!--标题-->
          <div class="wxlSft_st_yiji_title-DS-EntryPoint1-1">
            <div class="wxlSft_st_yiji_title_text-DS-EntryPoint1-1">
              今日推荐
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="less">
.overview_box {
  grid-area: 3 / 3 / 4 / 4;
  padding-top: 0px;
}
.weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 {
  margin: 0 auto;
  position: relative;
  width: 300px;
  height: 186px;
  box-sizing: border-box;
  color: #2b2b2b;
}
.wxlqc_section-DS-EntryPoint1-1 {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(60px);
  border-radius: 6px;
  .wxlqc_content-DS-EntryPoint1-1 {
    padding: 12px 0 12px 16px;
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    //标题
    .wxlqc_titleSection-DS-EntryPoint1-1 {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      .wxlqc_titleText-DS-EntryPoint1-1 {
        display: flex;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        color: #ffffff;
      }
    }
    //内容
    .wxlqc_todayQuizSection-DS-EntryPoint1-1 {
      position: relative;
      box-sizing: border-box;
      margin-top: 12px;
      .wxlqc_tqScroll-DS-EntryPoint1-1 {
        position: relative;
        box-sizing: border-box;
        height: 124px;
        overflow-x: hidden;
        overflow-y: auto;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        .wxlqc_tqQuestion-DS-EntryPoint1-1 {
          font-weight: 400;
          font-size: 14px;
          line-height: 18px;
          color: rgba(255, 255, 255, 0.8);
          padding-right: 12px;
        }
      }
    }
  }
}

//第二部分
.wxlSft_st_doable_section_v2-DS-EntryPoint1-1 {
  display: none;

  position: relative;
  width: 300px;
  height: 110px;
  box-sizing: border-box;
  margin-top: 12px;
  .wxlSft_st_doable_content-DS-EntryPoint1-1 {
    width: 100%;
    height: 110px;
    color: #ffffff;
    padding: 12px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(60px);
    border-radius: 6px;
    box-sizing: border-box;
    overflow: hidden;
    //标题
    .wxlSft_st_yiji_title-DS-EntryPoint1-1 {
      position: relative;
      height: 20px;
      margin-bottom: 12px;
    }
    .wxlSft_st_yiji_title_text-DS-EntryPoint1-1 {
      font-weight: 600;
      font-size: 14px;
      line-height: 20px;
      color: #ffffff;
    }
    //内容
  }
}

//.weatherLifeQuizCard_root_v2-DS-EntryPoint1-1.wxl_quizZhCn {
//  height: 186px;
//}
@media (min-width: 1304px) {
  .weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 {
    width: 300px;
  }
}
@media (min-width: 980px) and (max-width: 1303px) {
  .weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 {
    width: 300px;
  }
}
@media (max-width: 979px) {
  .overview_box {
    grid-area: 3 / 1 / 4 / 2;
  }
  .weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 {
    width: 300px;
    height: 270px;
  }
  .wxlSft_st_doable_section_v2-DS-EntryPoint1-1 {
    position: absolute;
    left: 0;
    bottom: 0;

    display: block;
  }

  //细节优化
  .weatherLifeQuizCard_root_v2-DS-EntryPoint1-1 {
    height: 300px;
  }
  .wxlqc_section-DS-EntryPoint1-1 {
    height: auto;
  }
}
</style>

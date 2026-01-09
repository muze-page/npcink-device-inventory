<script setup lang="ts">
import Nav from "@/components/theme/nav.vue";
import Tab from "@/components/theme/tab.vue";
import Details from "@/components/theme/tab/details.vue";
import Overview from "@/components/theme/tab/overview.vue";
</script>
<template>
  <div class="weatherContainer-DS-EntryPoint1-1 box">
    <div class="box_child">
      <Nav />
      <Tab />
      <Details />
      <Overview />
    </div>
  </div>
</template>
<style scoped lang="less">
.box {
  margin: 60px auto 20px;
}
.weatherContainer-DS-EntryPoint1-1 {
  position: relative;
  display: grid;
  grid-area: 1 / 2;
  gap: 20px;
  overflow: visible;
  z-index: 99;
}

.box_child {
  display: grid;
  gap: 12px;
}

@media (min-width: 980px) and (max-width: 1303px) {
  .weatherContainer-DS-EntryPoint1-1 {
    --weather-container-width: 924px;
    width: 924px;
  }
}

@media (min-width: 1304px) {
  .weatherContainer-DS-EntryPoint1-1 {
    --weather-container-width: 1236px;
    width: 1236px;
  }
  .box_child {
    grid-template-rows: 92px 267px 186px auto;
    grid-template-columns: 300px 612px 300px;
  }
}
@media (min-width: 980px) and (max-width: 1303px) {
  .box_child {
    grid-template-rows: 92px 267px 186px auto;
    grid-template-columns: 300px 300px 300px;
  }
}

@media (max-width: 979px) {
  .weatherContainer-DS-EntryPoint1-1 {
    --weather-container-width: 612px;
    width: 612px;
  }
  .box_child {
    grid-template-rows: 92px 467px 304px auto;
    grid-template-columns: 300px 300px;
  }
}


</style>

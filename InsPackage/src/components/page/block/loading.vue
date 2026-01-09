<script setup lang="ts">
//加载动画
//作者：德育处主任
//链接：https://juejin.cn/post/7037036742985121800
//来源：稀土掘金
//著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。
</script>
<template>
  <div class="box">
    <h2 class="title">获取数据中，请稍后……</h2>
    <div class="loading"></div>
  </div>
</template>
<style scoped>
.box {
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
.title {
  color: white;
  padding: 8rem;
}
.loading {
  display: initial;
}
.loading {
  position: relative;
  width: 50px;
  perspective: 200px;
}

.loading:before,
.loading:after {
  position: absolute;
  width: 20px;
  height: 20px;
  content: "";
  animation: jumping 0.5s infinite alternate;
  background: rgba(225, 69, 69, 0);
  border-radius: 6px;
}

.loading:before {
  left: 10px;
}

.loading:after {
  right: 10px;
  animation-delay: 0.15s;
}

@keyframes jumping {
  0% {
    transform: scale(1) translateY(0px) rotateX(0deg);
    box-shadow: 0 0 0 rgba(204, 220, 28, 0);
  }

  100% {
    transform: scale(1.2) translateY(-25px) rotateX(45deg);
    background: #fff;
    box-shadow: 0 25px 40px #fff;
  }
}
</style>

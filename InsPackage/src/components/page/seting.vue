<script setup lang="ts">
//设置
import axios from "axios";
import deviceData from "@/components/state/data";
import { reactive } from "vue";

const dataFrom = reactive({
  name: "", //名字
  //site:"",
 // password: "", //验证码
  site: "https://www.mqzj.top/wp-json/npcink/v1/device-post-data", //接口
  //site: "http://localhost:10048/wp-json/npcink/v1/device-post-data", //接口
  password: "9527", //验证码
  data: JSON.stringify(deviceData.value), //设备数据
});

//上传数据
const printData = () => {

  //数据校验
  if (dataFrom.name.length === 0) {
    alert("请填写姓名");
    return;
  }
  if (dataFrom.password.length === 0) {
    alert("请填写验证码");
    return;
  }
  if (dataFrom.site.length === 0) {
    alert("请填写网址");
    return;
  }

  //传输
  axios
    .post(dataFrom.site, dataFrom)
    .then((response) => {
      //console.log(response);
      const msg = response.data.data.message; //获取提示信息
      alert(msg);
      //返回编号，存入本地
    })
    .catch((error) => {
      if (error.response.data.data.error) {
        alert(error.response.data.data.error);
      } else {
        alert("设备信息上传失败，请联系管理员");
      }
      console.error(error); // 处理错误的响应
    });
  //将昵称存入本地
  // 将 ad 存储在本地存储中
  localStorage.setItem("name", dataFrom.name);
};
</script>

<template>
  <ul>
    <li>姓名: <input type="text" v-model="dataFrom.name" /></li>
    <details>
      <summary>更多配置</summary>
      <p>
        <li>验证: <input type="text" v-model="dataFrom.password" /></li>
        <li>
          网址: <input type="text" v-model="dataFrom.site" class="input_site" />
        </li>
      </p>
    </details>

    <li>
      <input
        type="submit"
        value="提交"
        @click="printData"
        class="input_button"
      />
    </li>
  </ul>
</template>
<style scoped lang="less">
ul {
  list-style: none;
  padding: 0;
  li {
    margin: 0.6em 0;
    input {
      border: 0;
      border-radius: 4px;
      padding: 6px 4px;
      font-size: 16px;
    }
  }
}
.input_site {
  width: 450px;
}
.input_button {
  color: #fff;
  padding: 6px 20px;
  background: rgba(0, 0, 0, 0.2);
  //transition: background-color .6s;
  cursor: pointer;
}
.input_button:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>

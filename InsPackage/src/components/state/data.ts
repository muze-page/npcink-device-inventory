import { ref } from "vue";
import { dataOne, dataTwo, dataThree } from "@/components/state/data_pc";

const deviceData = ref(null);

//使用测试数据
//deviceData.value = dataOne;
//deviceData.value = dataTwo;
//deviceData.value = dataThree;

const updateAllData = () => {
  deviceData.value = versionss.all();
  console.log("更新啦");
  console.log(deviceData.value);
};

//递归更新
const runUpdateAllData=(count: number) =>{
  if (count >= 300 || deviceData.value) {
    return; // 当计数器达到五分钟时，停止递归
  }

  //计时数据
  updateAllData();

  setTimeout(() => {
    // 使用 setTimeout 模拟定时器
    runUpdateAllData(count + 1); // 递归调用 runUpdateAllData，并将计数器加1
  }, 1000);
}

runUpdateAllData(0); // 初始调用，计数器初始值为0

//调试用
//deviceData.value = dataOne;
//console.log(deviceData.value);
export default deviceData;



import React, { useState } from "react";
import { Button, Input } from "antd";
import { fetchData } from "./axios";
import Detailed from "@/pages/part";
import { MysqlDeviceChange, Computer } from "@/type/index";
import ShowUser from "@/pages/showUser";
import "./search.css";

const App: React.FC = () => {
  const [responseData, setResponseData] = useState<MysqlDeviceChange>(); // 返回值
  const [displayData, setDisplayData] = useState<Computer>(); // 设备数据

  //输入框中的值
  // 定义状态变量用于存储输入框的值
  const [inputValue, setInputValue] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const canSearch = inputValue.trim() !== "" && queryValue.trim() !== "";

  // 处理输入框值的变化
  const handleInputChange = (e: any) => {
    setInputValue(e.target.value); // 更新状态变量中的值
  };

  const handleQueryChange = (e: any) => {
    setQueryValue(e.target.value);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await fetchData(inputValue, queryValue); //获取数据
      //空对象
      if (!data) {
        return;
      }
      /**
       * 渲染用数据
       *  将数组中的硬件数据从json格式处理成对象
       */
      const parsedData = JSON.parse(data.data); //从字符串处理为对象

      setResponseData(data); // 存储返回数据
      setDisplayData(parsedData); // 存储对象设备数据
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="public-search">
        <div className="search-shell">
          <header className="search-hero">
            <div className="hero-copy">
              <span className="hero-eyebrow">设备资产 / 公共查询</span>
              <h1>设备查询中心</h1>
              <p>
                输入授权口令与设备号/姓名, 快速获取设备状态与硬件细节.
              </p>
              <div className="hero-meta">
                <span>口令校验</span>
                <span>编号 / 姓名</span>
                <span>2 分钟缓存</span>
              </div>
            </div>
            <div className="hero-panel">
              <div className="panel-head">
                <div>
                  <h2>开始查询</h2>
                  <p>密码仅用于本次请求验证</p>
                </div>
                <span className="panel-badge">实时</span>
              </div>
              <div className="panel-form">
                <div className="field">
                  <label>访问口令</label>
                  <Input.Password
                    placeholder="后台设置的查询密码"
                    value={inputValue}
                    onChange={handleInputChange}
                    className="search-input"
                    autoComplete="current-password"
                    onPressEnter={handleSearch}
                    allowClear
                  />
                </div>
                <div className="field">
                  <label>设备号或姓名</label>
                  <Input
                    placeholder="例如: A0213 / 张三"
                    value={queryValue}
                    onChange={handleQueryChange}
                    className="search-input"
                    onPressEnter={handleSearch}
                    allowClear
                  />
                </div>
                <Button
                  type="primary"
                  className="search-button"
                  onClick={handleSearch}
                  loading={isLoading}
                  disabled={!canSearch}
                >
                  查询设备
                </Button>
                <div className="panel-note">
                  <span className="note-label">提示</span>
                  <span>
                    如提示缺少密码, 请确认请求未被安全插件拦截.
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className="result-section">
            <div className="section-title">
              <h2>查询结果</h2>
              <p>匹配到的设备将显示基础信息与详细硬件配置.</p>
            </div>
            {!responseData && (
              <div className="result-empty">
                <div className="empty-icon">i</div>
                <div>
                  <h3>等待查询</h3>
                  <p>输入密码与设备号/姓名后点击查询.</p>
                </div>
              </div>
            )}
            {responseData && (
              <div className="result-grid">
                <ShowUser data={responseData} />
                <div className="detail-card">
                  <Detailed data={displayData!} />
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default App;

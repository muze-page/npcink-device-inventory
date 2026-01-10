/**
 * 展示用户数据
 */
import React from "react";
import { formatDate } from "@/utils/tool";
import { MysqlDeviceChange } from "@/type/index";

interface Props {
  data: MysqlDeviceChange; //设备数据
}
const App: React.FC<Props> = ({ data }) => {
  const stateLabel = data.state || "未知";
  const stateKey = stateLabel
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  const statusClass = stateKey ? `status-${stateKey}` : "status-default";
  const createdAt = data.created_at ? formatDate(data.created_at) : "-";
  const updatedAt = data.updated_at ? formatDate(data.updated_at) : "-";

  return (
    <>
      <section className="device-summary">
        <div className="summary-top">
          <div>
            <p className="summary-eyebrow">设备概览</p>
            <h3>基础信息</h3>
          </div>
          <span className={`status-pill ${statusClass}`}>{stateLabel}</span>
        </div>
        <dl className="summary-list">
          <div className="summary-item">
            <dt>编号</dt>
            <dd>{data.number || "-"}</dd>
          </div>
          <div className="summary-item">
            <dt>姓名</dt>
            <dd>{data.name || "-"}</dd>
          </div>
          <div className="summary-item">
            <dt>部门</dt>
            <dd>{data.department || "-"}</dd>
          </div>
          <div className="summary-item">
            <dt>创建时间</dt>
            <dd>{createdAt}</dd>
          </div>
          <div className="summary-item">
            <dt>更新时间</dt>
            <dd>{updatedAt}</dd>
          </div>
          <div className="summary-item">
            <dt>UUID</dt>
            <dd className="mono">{data.uuid || "-"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
};
export default App;

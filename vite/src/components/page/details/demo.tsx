import { useState } from "react";
import { Select } from "antd";

const { Option } = Select;

function App() {
  const [size, setSize] = useState(null);
  const [weight, setWeight] = useState(null);
  const [dimension, setDimension] = useState(null);

  const data = [
    { id: 1, size: 2, weight: "light", dimension: "2D" },
    { id: 2, size: 7, weight: "heavy", dimension: "3D" },
    { id: 3, size: 5, weight: "medium", dimension: "2D" },
    // ...
  ];

  const filteredData = data.filter((item) => {
    let sizeCondition = true;
    if (size) {
      if (size === "small") {
        sizeCondition = item.size <= 3;
      } else if (size === "medium") {
        sizeCondition = item.size > 3 && item.size <= 6;
      } else if (size === "large") {
        sizeCondition = item.size > 6;
      }
    }

    return (
      sizeCondition &&
      (!weight || item.weight === weight) &&
      (!dimension || item.dimension === dimension)
    );
  });

  return (
    <div>
      <Select
        placeholder="Select size"
        onChange={(value) => {
          setSize(value);
          console.log(value);
          console.log(size);
          console.log(filteredData);
        }}
      >
        <Option value="small">Small</Option>
        <Option value="medium">Medium</Option>
        <Option value="large">Large</Option>
      </Select>
      <Select
        placeholder="Select weight"
        onChange={(value) => setWeight(value)}
      >
        <Option value="light">Light</Option>
        <Option value="medium">Medium</Option>
        <Option value="heavy">Heavy</Option>
      </Select>
      <Select
        placeholder="Select dimension"
        onChange={(value) => setDimension(value)}
      >
        <Option value="2D">2D</Option>
        <Option value="3D">3D</Option>
      </Select>

      {filteredData.map((item) => (
        <div key={item.id}>
          {item.size} - {item.weight} - {item.dimension}
        </div>
      ))}
    </div>
  );
}

export default App;

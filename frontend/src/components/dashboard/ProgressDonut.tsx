import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutEntry {
  name: string;
  value: number;
  fill: string;
}

interface ProgressDonutProps {
  data: DonutEntry[];
}

const ProgressDonut: React.FC<ProgressDonutProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={78}
        paddingAngle={2}
        dataKey="value"
        startAngle={90}
        endAngle={-270}
        strokeWidth={0}
      >
        {data.map((entry) => (
          <Cell key={entry.name} fill={entry.fill} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);

export default ProgressDonut;

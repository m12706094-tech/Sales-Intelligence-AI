import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Props {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'table';
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DataVisualization: React.FC<Props> = ({ data, type }) => {
  if (!data || data.length === 0) return <div className="p-4 text-zinc-500 italic">No data to display</div>;

  // Attempt to find numeric and categorical keys
  const keys = Object.keys(data[0]);
  const numericKey = keys.find(k => typeof data[0][k] === 'number') || keys[keys.length - 1];
  const categoryKey = keys.find(k => typeof data[0][k] === 'string') || keys[0];

  if (type === 'table') {
    return (
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              {keys.map(k => (
                <th key={k} className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {data.slice(0, 10).map((row, i) => (
              <tr key={i}>
                {keys.map(k => (
                  <td key={k} className="px-4 py-2 whitespace-nowrap text-sm text-zinc-900">
                    {typeof row[k] === 'number' ? row[k].toLocaleString() : String(row[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && (
          <div className="p-2 text-center text-xs text-zinc-400 border-t">
            Showing first 10 of {data.length} rows
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={categoryKey} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey={numericKey} fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey={categoryKey} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Line type="monotone" dataKey={numericKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={numericKey}
              nameKey={categoryKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

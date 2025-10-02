import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const GraficoGauge = ({ value, max, title, icon: Icon, color }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const data = [
    { name: 'Usado', value: percentage },
    { name: 'Disponible', value: 100 - percentage }
  ];
  
  const COLORS = [color, '#383735'];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-6 h-6" style={{ color }} />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={230}
            endAngle={-50}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-4">
        <p className="text-3xl font-bold" style={{ color, paddingTop: '0.5rem', marginTop: '-9rem' }}>
          {percentage.toFixed(1)}%
        </p>
        <p className="text-sm text-gray-600 mt-1" style={{ marginTop: '4rem' }}>
          {typeof value === 'number' && value > 1000 
            ? value.toLocaleString() 
            : value.toFixed(2)} / {max.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default GraficoGauge;
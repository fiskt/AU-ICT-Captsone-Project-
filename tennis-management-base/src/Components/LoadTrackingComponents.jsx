import '../App.css'
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 1. Register the parts Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function LoadGraph() {
  // 2. Define your data
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Training Load',
        data: [65, 59, 80, 81, 56, 55, 40],
        borderColor: '#EC7842', // Your accent color
        backgroundColor: 'rgba(236, 120, 66, 0.5)',
        tension: 0.3, // Makes the line slightly curved
      },
    ],
  };

  // 3. Define options (optional)
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    maintainAspectRatio: false, // Allows it to fill your container
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={data} options={options} />
    </div>
  );
}

import '../App.css'
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export function EXERTION_GRAPH() {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Current Training Load',
        data: [6.5, 5.9, 8.0, 8.1, 5.6, 5.5, 4.0],
        borderColor: '#EC7842',
        backgroundColor: 'rgba(236, 120, 66, 0.5)',
        tension: 0.3,
      }, {
        label: 'Average Training Load',
        data: [4.6, 5.8, 7.4, 8.3, 7.9, 9.2, 6.8],
        borderColor: '#EC784280',
        backgroundColor: 'rgba(236, 120, 66, 0.5)',
        tension: 0.3,
      }
    ],
  };

  const options = {
    responsive: true,
    scales: {
        y: { min: 0, max: 10, ticks: {stepSize: 0.5}}
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '500px', width: '400px' }}>
      <Line data={data} options={options} />
    </div>
  );
}


export function NUM_DRILLS_GRAPH() {
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Drills Completed',
        data: [3, 4, 4, 0, 0, 2, 2],
        borderColor: '#EC7842',
        backgroundColor: 'rgba(236, 120, 66, 0.5)'
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '300px', width: '400px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export function DRILL_TYPE_GRAPH() {
    const data = {
    labels: ['Tennis', 'Movement'],
    datasets: [
      {
        label: 'Drills Completed',
        data: [5, 10],
        borderColor: ['#EC7842', 'black'],
        backgroundColor: ['rgba(236, 120, 66, 0.5)', 'gray']
      }, 
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: '300px', width: '400px' }}>
      <Pie data={data} options={options} />
    </div>
  );
}


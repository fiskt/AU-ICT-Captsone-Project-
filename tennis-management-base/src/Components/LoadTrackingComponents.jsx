import '../App.css'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function EXERTION_GRAPH() {
    const exertion_data = [
    { day: 'Mon', acute: 400, chronic: 300 },
    { day: 'Tue', acute: 300, chronic: 320 },
    { day: 'Wed', acute: 200, chronic: 310 },
    { day: 'Thu', acute: 600, chronic: 350 },
    { day: 'Fri', acute: 180, chronic: 340 },
    { day: 'Sat', acute: 400, chronic: 360 },
    { day: 'Sun', acute: 50,  chronic: 320 },
    ];
    return (
        <div class="graph-container" id="exertion-graph-container">
                <LineChart style={{ width: '100%', height: 300 }} data={exertion_data} >
                    <CartesianGrid strokeDasharray="3 3" stroke='white'/>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="acute" stroke='black' strokeWidth="2" />
                    <Line type="monotone" dataKey="chronic" stroke='green' strokeDasharray="5 5" />
                </LineChart>
        </div>
    );
}


const data = [{ name: 'A', uv: 10 }, { name: 'B', uv: 20 }];
export function LoadGraph() {
  return (
    <div className="content-box">
      <LineChart width={400} height={200} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line type="monotone" dataKey="uv" stroke="#EC7842" />
      </LineChart>
    </div>
  );
}
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { FiTruck, FiMapPin, FiLogIn, FiLogOut, FiActivity, FiFileText, FiMapPin as FiLocation } from 'react-icons/fi'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, entriesRes, allEntriesRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/entries?per_page=10'),
        axios.get('/api/entries?per_page=100')
      ])
      
      setStats(statsRes.data)
      setRecentEntries(entriesRes.data.entries)
      
      // Process data for charts
      const entries = allEntriesRes.data.entries
      const hourlyData = {}
      const typeData = { in: 0, out: 0 }
      
      entries.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours()
        if (!hourlyData[hour]) {
          hourlyData[hour] = { hour: `${hour}:00`, in: 0, out: 0 }
        }
        hourlyData[hour][entry.entry_type]++
        typeData[entry.entry_type]++
      })
      
      setChartData(Object.values(hourlyData).sort((a, b) => {
        const hourA = parseInt(a.hour.split(':')[0])
        const hourB = parseInt(b.hour.split(':')[0])
        return hourA - hourB
      }))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const pieData = stats ? [
    { name: 'Entries', value: stats.entries_in || 0, color: '#4CAF50' },
    { name: 'Exits', value: stats.entries_out || 0, color: '#FF4C4C' }
  ].filter(item => item.value > 0) : []

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Monitor vehicle entries and exits in real-time</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Vehicles</div>
              <div className="stat-value">{stats?.total_vehicles || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Currently Inside</div>
              <div className="stat-value">{stats?.vehicles_inside || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Entries</div>
              <div className="stat-value">{stats?.entries_in || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Exits</div>
              <div className="stat-value">{stats?.entries_out || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Today's Entries</div>
              <div className="stat-value">{stats?.today_entries || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-content">
              <div className="stat-label">Total Records</div>
              <div className="stat-value">{stats?.total_entries || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Entry/Exit Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="hour" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="in" 
                stroke="#4CAF50" 
                strokeWidth={2}
                name="Entries"
                dot={{ fill: '#4CAF50', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="out" 
                stroke="#FF4C4C" 
                strokeWidth={2}
                name="Exits"
                dot={{ fill: '#FF4C4C', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Entry vs Exit Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-entries-section">
        <h2>Recent Entries</h2>
        <div className="entries-list">
          {recentEntries.length === 0 ? (
            <div className="empty-state">No entries yet</div>
          ) : (
            recentEntries.map((entry) => (
              <div key={entry.id} className="entry-card">
                <div className={`entry-icon ${entry.entry_type === 'in' ? 'icon-in' : 'icon-out'}`}>
                  {entry.entry_type === 'in' ? (
                    <FiLogIn className="entry-icon-svg" />
                  ) : (
                    <FiLogOut className="entry-icon-svg" />
                  )}
                </div>
                <div className="entry-details">
                  <div className="entry-header">
                    <span className="entry-type">{entry.entry_type.toUpperCase()}</span>
                    <span className="entry-time">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="entry-info">
                    <span className="plate-number">{entry.plate_number}</span>
                    <span className="vehicle-type">{entry.vehicle_type}</span>
                    <span className="owner-name">{entry.owner_name}</span>
                  </div>
                  <div className="entry-location">
                    <FiLocation className="location-icon" />
                    {entry.location}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard


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
import { FiTruck, FiMapPin, FiLogIn, FiLogOut, FiActivity, FiFileText, FiMapPin as FiLocation, FiChevronDown, FiFilter, FiCalendar, FiX } from 'react-icons/fi'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [filterPeriod, setFilterPeriod] = useState('today')
  const [allEntries, setAllEntries] = useState([])
  const [entriesFilter, setEntriesFilter] = useState({ type: 'all', fromDate: null, toDate: null })
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (allEntries.length > 0) {
      processChartData()
    }
  }, [filterPeriod, allEntries])

  const fetchData = async () => {
    try {
      const [statsRes, entriesRes, allEntriesRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/entries?per_page=10'),
        axios.get('/api/entries?per_page=1000')
      ])
      
      setStats(statsRes.data)
      setRecentEntries(entriesRes.data.entries)
      setAllEntries(allEntriesRes.data.entries)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEntriesByPeriod = (entries) => {
    const now = new Date()
    let startDate = new Date()

    switch (filterPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'daily':
        // Last 7 days
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'weekly':
        // Last 4 weeks
        startDate.setDate(now.getDate() - 28)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'monthly':
        // Last 6 months
        startDate.setMonth(now.getMonth() - 6)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yearly':
        // Last year
        startDate.setFullYear(now.getFullYear() - 1)
        startDate.setHours(0, 0, 0, 0)
        break
      default:
        startDate.setHours(0, 0, 0, 0)
    }

    return entries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= startDate && entryDate <= now
    })
  }

  const processChartData = () => {
    const filteredEntries = filterEntriesByPeriod(allEntries)
    
    if (filterPeriod === 'today') {
      // Hourly data for today
      const hourlyData = {}
      filteredEntries.forEach(entry => {
        const hour = new Date(entry.timestamp).getHours()
        if (!hourlyData[hour]) {
          hourlyData[hour] = { hour: `${hour}:00`, in: 0, out: 0 }
        }
        hourlyData[hour][entry.entry_type]++
      })
      
      setChartData(Object.values(hourlyData).sort((a, b) => {
        const hourA = parseInt(a.hour.split(':')[0])
        const hourB = parseInt(b.hour.split(':')[0])
        return hourA - hourB
      }))
    } else if (filterPeriod === 'daily') {
      // Daily data for last 7 days
      const dailyData = {}
      filteredEntries.forEach(entry => {
        const date = new Date(entry.timestamp)
        const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { hour: dateKey, in: 0, out: 0 }
        }
        dailyData[dateKey][entry.entry_type]++
      })
      setChartData(Object.values(dailyData).sort((a, b) => {
        return new Date(a.hour) - new Date(b.hour)
      }))
    } else if (filterPeriod === 'weekly') {
      // Weekly data for last 4 weeks
      const weeklyData = {}
      filteredEntries.forEach(entry => {
        const date = new Date(entry.timestamp)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { hour: weekKey, in: 0, out: 0 }
        }
        weeklyData[weekKey][entry.entry_type]++
      })
      setChartData(Object.values(weeklyData).sort((a, b) => {
        return new Date(a.hour) - new Date(b.hour)
      }))
    } else if (filterPeriod === 'monthly') {
      // Monthly data for last 6 months
      const monthlyData = {}
      filteredEntries.forEach(entry => {
        const date = new Date(entry.timestamp)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { hour: monthKey, in: 0, out: 0 }
        }
        monthlyData[monthKey][entry.entry_type]++
      })
      setChartData(Object.values(monthlyData).sort((a, b) => {
        return new Date(a.hour) - new Date(b.hour)
      }))
    } else if (filterPeriod === 'yearly') {
      // Yearly data for last year
      const yearlyData = {}
      filteredEntries.forEach(entry => {
        const date = new Date(entry.timestamp)
        const yearKey = date.toLocaleDateString('en-US', { month: 'short' })
        if (!yearlyData[yearKey]) {
          yearlyData[yearKey] = { hour: yearKey, in: 0, out: 0 }
        }
        yearlyData[yearKey][entry.entry_type]++
      })
      setChartData(Object.values(yearlyData).sort((a, b) => {
        return new Date(a.hour) - new Date(b.hour)
      }))
    }
  }
  
  const getFilteredPieData = () => {
    const filteredEntries = filterEntriesByPeriod(allEntries)
    const typeData = { in: 0, out: 0 }
    
    filteredEntries.forEach(entry => {
      typeData[entry.entry_type]++
    })
    
    return [
      { name: 'Entries', value: typeData.in || 0, color: '#4CAF50' },
      { name: 'Exits', value: typeData.out || 0, color: '#FF4C4C' }
    ].filter(item => item.value > 0)
  }

  const pieData = allEntries.length > 0 ? getFilteredPieData() : []

  const getFilteredRecentEntries = () => {
    if (entriesFilter.type === 'all') {
      return recentEntries
    }

    const now = new Date()
    let startDate = new Date()
    let endDate = new Date()

    switch (entriesFilter.type) {
      case 'daily':
        startDate = new Date()
        startDate.setDate(now.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'weekly':
        startDate = new Date()
        startDate.setDate(now.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'monthly':
        startDate = new Date()
        startDate.setMonth(now.getMonth() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'yearly':
        startDate = new Date()
        startDate.setFullYear(now.getFullYear() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'range':
        startDate = new Date(entriesFilter.fromDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(entriesFilter.toDate)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        return recentEntries
    }

    return recentEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  const filteredRecentEntries = getFilteredRecentEntries()

  const handleFilterChange = (type) => {
    if (type === 'range') {
      setEntriesFilter({ ...entriesFilter, type })
    } else {
      setEntriesFilter({ type: type, fromDate: null, toDate: null })
    }
  }

  const handleDateRangeChange = (fromDate, toDate) => {
    setEntriesFilter({ ...entriesFilter, fromDate, toDate })
    setShowFilterDropdown(false)
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return `${Math.floor(diffInSeconds / 604800)}w ago`
  }

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
          <div className="chart-header">
            <h3 className="chart-title">Entry/Exit Trends</h3>
            <div className="chart-filter">
              <select 
                className="period-filter"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="daily">Daily (7 days)</option>
                <option value="weekly">Weekly (4 weeks)</option>
                <option value="monthly">Monthly (6 months)</option>
                <option value="yearly">Yearly</option>
              </select>
              <FiChevronDown className="filter-chevron" />
            </div>
          </div>
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
                type="natural" 
                dataKey="in" 
                stroke="#4CAF50" 
                strokeWidth={2}
                name="Entries"
                dot={{ fill: '#4CAF50', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="natural" 
                dataKey="out" 
                stroke="#FF4C4C" 
                strokeWidth={2}
                name="Exits"
                dot={{ fill: '#FF4C4C', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Entry vs Exit Distribution</h3>
          </div>
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
        <div className="section-header">
          <h2>Recent Entries</h2>
          <div className="section-header-actions">
            <span className="entries-count">{filteredRecentEntries.length} entries</span>
            <div className="filter-dropdown-container">
              <button 
                className="filter-button"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <FiFilter className="filter-icon" />
              </button>
              {showFilterDropdown && (
                <div className="filter-dropdown">
                  <div className="filter-option" onClick={() => { handleFilterChange('all'); setShowFilterDropdown(false) }}>
                    <FiCalendar className="filter-option-icon" />
                    <span>All Time</span>
                  </div>
                  <div className="filter-option" onClick={() => { handleFilterChange('daily'); setShowFilterDropdown(false) }}>
                    <FiCalendar className="filter-option-icon" />
                    <span>Daily</span>
                  </div>
                  <div className="filter-option" onClick={() => { handleFilterChange('weekly'); setShowFilterDropdown(false) }}>
                    <FiCalendar className="filter-option-icon" />
                    <span>Weekly</span>
                  </div>
                  <div className="filter-option" onClick={() => { handleFilterChange('monthly'); setShowFilterDropdown(false) }}>
                    <FiCalendar className="filter-option-icon" />
                    <span>Monthly</span>
                  </div>
                  <div className="filter-option" onClick={() => { handleFilterChange('yearly'); setShowFilterDropdown(false) }}>
                    <FiCalendar className="filter-option-icon" />
                    <span>Yearly</span>
                  </div>
                  <div className="filter-divider"></div>
                  <div 
                    className="filter-option filter-range-option"
                    onClick={() => handleFilterChange('range')}
                  >
                    <FiCalendar className="filter-option-icon" />
                    <span>Custom Range</span>
                  </div>
                  {entriesFilter.type === 'range' && (
                    <div className="filter-range-inputs" onClick={(e) => e.stopPropagation()}>
                      <div className="range-input-group">
                        <label>From</label>
                        <input
                          type="date"
                          value={entriesFilter.fromDate || ''}
                          onChange={(e) => setEntriesFilter({ ...entriesFilter, fromDate: e.target.value })}
                        />
                      </div>
                      <div className="range-input-group">
                        <label>To</label>
                        <input
                          type="date"
                          value={entriesFilter.toDate || ''}
                          onChange={(e) => setEntriesFilter({ ...entriesFilter, toDate: e.target.value })}
                        />
                      </div>
                      <button 
                        className="apply-range-button"
                        onClick={() => {
                          if (entriesFilter.fromDate && entriesFilter.toDate) {
                            handleDateRangeChange(entriesFilter.fromDate, entriesFilter.toDate)
                          }
                        }}
                        disabled={!entriesFilter.fromDate || !entriesFilter.toDate}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="entries-list">
          {filteredRecentEntries.length === 0 ? (
            <div className="empty-state">
              <FiFileText className="empty-icon" />
              <p>No entries found</p>
              <p className="empty-hint">Try adjusting your filter settings</p>
            </div>
          ) : (
            filteredRecentEntries.map((entry) => {
              const entryDate = new Date(entry.timestamp)
              const timeAgo = getTimeAgo(entryDate)
              
              return (
                <div key={entry.id} className={`entry-card ${entry.entry_type === 'in' ? 'entry-in' : 'entry-out'}`}>
                  <div className={`entry-icon ${entry.entry_type === 'in' ? 'icon-in' : 'icon-out'}`}>
                    {entry.entry_type === 'in' ? (
                      <FiLogIn className="entry-icon-svg" />
                    ) : (
                      <FiLogOut className="entry-icon-svg" />
                    )}
                  </div>
                  <div className="entry-content">
                    <div className="entry-main">
                      <div className="entry-primary">
                        <div className="entry-plate-wrapper">
                          <span className="plate-number">{entry.plate_number}</span>
                          <span className={`entry-badge ${entry.entry_type === 'in' ? 'badge-in' : 'badge-out'}`}>
                            {entry.entry_type === 'in' ? 'ENTRY' : 'EXIT'}
                          </span>
                        </div>
                        <div className="entry-vehicle-info">
                          <span className="vehicle-type">{entry.vehicle_type}</span>
                          <span className="entry-separator">•</span>
                          <span className="owner-name">{entry.owner_name}</span>
                        </div>
                      </div>
                      <div className="entry-meta">
                        <div className="entry-time-group">
                          <span className="entry-time">{entryDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}</span>
                          <span className="entry-date">{entryDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                        <span className="time-ago">{timeAgo}</span>
                      </div>
                    </div>
                    <div className="entry-footer">
                      <div className="entry-location">
                        <FiLocation className="location-icon" />
                        <span>{entry.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard


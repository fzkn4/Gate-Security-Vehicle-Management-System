import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FiLogIn, FiLogOut, FiFilter, FiTrash2 } from 'react-icons/fi'
import './History.css'

const History = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    page: 1
  })
  const [pagination, setPagination] = useState({})

  useEffect(() => {
    fetchEntries()
  }, [filters])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params = {
        page: filters.page,
        per_page: 50
      }
      if (filters.type) {
        params.type = filters.type
      }
      
      const response = await axios.get('/api/entries', { params })
      setEntries(response.data.entries)
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      })
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && entries.length === 0) {
    return <div className="page-loading">Loading history...</div>
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <h1>Entry History</h1>
        <p>View all vehicle entry and exit records</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <label>Filter by Type:</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All</option>
            <option value="in">Entry Only</option>
            <option value="out">Exit Only</option>
          </select>
        </div>
        <div className="results-count">
          Showing {entries.length} of {pagination.total || 0} entries
        </div>
      </div>

      <div className="entries-container">
        {entries.length === 0 ? (
          <div className="empty-state">No entries found</div>
        ) : (
          <>
            <div className="entries-list">
              {entries.map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div className={`entry-icon ${entry.entry_type === 'in' ? 'icon-in' : 'icon-out'}`}>
                    {entry.entry_type === 'in' ? (
                      <FiLogIn className="entry-icon-svg" />
                    ) : (
                      <FiLogOut className="entry-icon-svg" />
                    )}
                  </div>
                  <div className="entry-content">
                    <div className="entry-header">
                      <span className={`entry-type-badge type-${entry.entry_type}`}>
                        {entry.entry_type.toUpperCase()}
                      </span>
                      <span className="entry-time">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="entry-details">
                      <div className="detail-row">
                        <span className="detail-label">Plate Number:</span>
                        <span className="detail-value">{entry.plate_number}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Vehicle Type:</span>
                        <span className="detail-value">{entry.vehicle_type}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Owner:</span>
                        <span className="detail-value">{entry.owner_name}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{entry.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {pagination.current_page} of {pagination.pages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= pagination.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default History


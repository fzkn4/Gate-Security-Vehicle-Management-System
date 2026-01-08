import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { FiLogIn, FiLogOut, FiFilter, FiTrash2, FiCalendar, FiX } from 'react-icons/fi'
import './History.css'

const History = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    page: 1
  })
  const [pagination, setPagination] = useState({})
  const [entriesFilter, setEntriesFilter] = useState({ type: 'all', entryType: ['in', 'out'], fromDate: null, toDate: null })
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [allEntries, setAllEntries] = useState([])

  useEffect(() => {
    fetchEntries()
  }, [filters])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterDropdown) {
        const filterContainer = document.querySelector('.filter-dropdown-container')
        if (filterContainer && !filterContainer.contains(event.target)) {
          setShowFilterDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterDropdown])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params = {
        page: filters.page,
        per_page: 50
      }
      
      const response = await axios.get('/api/entries', { params })
      setEntries(response.data.entries)
      setPagination({
        total: response.data.total,
        pages: response.data.pages,
        current_page: response.data.current_page
      })

      const allEntriesRes = await axios.get('/api/entries?per_page=10000')
      setAllEntries(allEntriesRes.data.entries)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getFilteredEntries = () => {
    let filtered = [...allEntries]

    if (entriesFilter.type !== 'all') {
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
          if (entriesFilter.fromDate && entriesFilter.toDate) {
            startDate = new Date(entriesFilter.fromDate)
            startDate.setHours(0, 0, 0, 0)
            endDate = new Date(entriesFilter.toDate)
            endDate.setHours(23, 59, 59, 999)
          }
          break
        default:
          break
      }

      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp)
        return entryDate >= startDate && entryDate <= endDate
      })
    }

    if (entriesFilter.entryType && Array.isArray(entriesFilter.entryType) && entriesFilter.entryType.length > 0) {
      filtered = filtered.filter(entry => entriesFilter.entryType.includes(entry.entry_type))
    }

    return filtered
  }

  const handleFilterChange = (type) => {
    setEntriesFilter(prev => ({
      type: type,
      entryType: prev.entryType || ['in', 'out'],
      fromDate: type === 'range' ? prev.fromDate : null,
      toDate: type === 'range' ? prev.toDate : null
    }))
  }

  const handleEntryTypeToggle = (entryType) => {
    setEntriesFilter(prev => {
      const currentEntryType = prev.entryType || ['in', 'out']
      const newEntryType = currentEntryType.includes(entryType)
        ? currentEntryType.filter(t => t !== entryType)
        : [...currentEntryType, entryType]
      return { 
        ...prev, 
        entryType: newEntryType.length > 0 ? newEntryType : ['in', 'out'],
        type: prev.type || 'all',
        fromDate: prev.fromDate || null,
        toDate: prev.toDate || null
      }
    })
  }

  const handleDateRangeChange = (fromDate, toDate) => {
    setEntriesFilter(prev => ({
      type: prev.type || 'all',
      entryType: prev.entryType || ['in', 'out'],
      fromDate: fromDate,
      toDate: toDate
    }))
  }

  const clearFilters = () => {
    setEntriesFilter({ 
      type: 'all', 
      entryType: ['in', 'out'], 
      fromDate: null, 
      toDate: null 
    })
    setShowFilterDropdown(false)
  }

  const applyFilters = () => {
    setShowFilterDropdown(false)
  }

  const hasActiveFilters = () => {
    return entriesFilter.type !== 'all' || 
           (entriesFilter.entryType && entriesFilter.entryType.length !== 2) ||
           entriesFilter.fromDate ||
           entriesFilter.toDate
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (entriesFilter.type !== 'all') count++
    if (entriesFilter.entryType && entriesFilter.entryType.length !== 2) count++
    if (entriesFilter.fromDate && entriesFilter.toDate) count++
    return count
  }

  const filteredEntries = getFilteredEntries()

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
        <div className="results-count">
          Showing {filteredEntries.length} entries
        </div>
        <div className="filter-group">
          <div className="filter-dropdown-container">
            <button 
              className={`filter-button ${hasActiveFilters() ? 'active' : ''}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <FiFilter className="filter-icon" />
              {hasActiveFilters() && (
                <span className="filter-badge">{getActiveFilterCount()}</span>
              )}
            </button>
            {showFilterDropdown && (
              <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="filter-header">
                  <span className="filter-header-title">Filters</span>
                  {hasActiveFilters() && (
                    <button 
                      className="clear-filters-button"
                      onClick={clearFilters}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="filter-section">
                  <div className="filter-section-title">Entry Type</div>
                  <div className="filter-chips">
                    <button 
                      className={`filter-chip ${entriesFilter.entryType && entriesFilter.entryType.includes('in') ? 'active' : ''}`}
                      onClick={() => handleEntryTypeToggle('in')}
                    >
                      <FiLogIn className="filter-chip-icon" />
                      <span>Entry</span>
                    </button>
                    <button 
                      className={`filter-chip ${entriesFilter.entryType && entriesFilter.entryType.includes('out') ? 'active' : ''}`}
                      onClick={() => handleEntryTypeToggle('out')}
                    >
                      <FiLogOut className="filter-chip-icon" />
                      <span>Exit</span>
                    </button>
                  </div>
                </div>

                <div className="filter-section">
                  <div className="filter-section-title">Time Period</div>
                  <div className="filter-grid">
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'all' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('all')}
                    >
                      <span className="filter-grid-label">All Time</span>
                    </div>
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'daily' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('daily')}
                    >
                      <span className="filter-grid-label">Daily</span>
                    </div>
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'weekly' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('weekly')}
                    >
                      <span className="filter-grid-label">Weekly</span>
                    </div>
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'monthly' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('monthly')}
                    >
                      <span className="filter-grid-label">Monthly</span>
                    </div>
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'yearly' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('yearly')}
                    >
                      <span className="filter-grid-label">Yearly</span>
                    </div>
                    <div 
                      className={`filter-grid-item ${entriesFilter.type === 'range' ? 'active' : ''}`}
                      onClick={() => handleFilterChange('range')}
                    >
                      <span className="filter-grid-label">Custom</span>
                    </div>
                  </div>
                </div>

                {entriesFilter.type === 'range' && (
                  <div className="filter-section">
                    <div className="filter-section-title">Custom Range</div>
                    <div className="filter-range-inputs">
                      <div className="range-input-group">
                        <label>From Date</label>
                        <input
                          type="date"
                          value={entriesFilter.fromDate || ''}
                          onChange={(e) => setEntriesFilter({ ...entriesFilter, fromDate: e.target.value })}
                        />
                      </div>
                      <div className="range-input-group">
                        <label>To Date</label>
                        <input
                          type="date"
                          value={entriesFilter.toDate || ''}
                          onChange={(e) => setEntriesFilter({ ...entriesFilter, toDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="filter-footer">
                  <button 
                    className="apply-filters-button"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="entries-container">
        {filteredEntries.length === 0 ? (
          <div className="empty-state">
            <FiFilter className="empty-icon" />
            <p>{hasActiveFilters() ? 'No entries match your filters' : 'No entries found'}</p>
            <p className="empty-hint">{hasActiveFilters() ? 'Try adjusting your filter settings' : 'Vehicle entries will appear here'}</p>
            {hasActiveFilters() && (
              <button 
                className="empty-state-action"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="entries-list">
              {filteredEntries.map((entry) => (
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


import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiPlus, FiEdit, FiTrash2, FiMaximize2, FiTruck, FiDownload } from 'react-icons/fi'
import './Vehicles.css'

const Vehicles = () => {
  const { user: currentUser } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQR, setSelectedQR] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [formData, setFormData] = useState({
    plate_number: '',
    vehicle_type: 'car',
    make: '',
    model: '',
    color: '',
    user_id: currentUser?.id || ''
  })

  useEffect(() => {
    fetchVehicles()
    if (currentUser?.role === 'admin') {
      fetchUsers()
    }
  }, [currentUser])

  const fetchVehicles = async () => {
    try {
      const response = await axios.get('/api/vehicles')
      setVehicles(response.data)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCreate = () => {
    setEditingVehicle(null)
    setFormData({
      plate_number: '',
      vehicle_type: 'car',
      make: '',
      model: '',
      color: '',
      user_id: currentUser?.id || ''
    })
    setShowModal(true)
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      plate_number: vehicle.plate_number,
      vehicle_type: vehicle.vehicle_type,
      make: vehicle.make || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      user_id: vehicle.user_id
    })
    setShowModal(true)
  }

  const handleViewQR = (vehicle) => {
    setSelectedQR(vehicle)
    setShowQRModal(true)
  }

  const handleDownloadQR = () => {
    if (!selectedQR || !selectedQR.qr_code) return
    
    try {
      // Convert base64 to blob
      const base64Data = selectedQR.qr_code.replace(/^data:image\/png;base64,/, '')
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `QR_Code_${selectedQR.plate_number.replace(/\s+/g, '_')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingVehicle) {
        await axios.put(`/api/vehicles/${editingVehicle.id}`, formData)
      } else {
        await axios.post('/api/vehicles', formData)
      }
      setShowModal(false)
      fetchVehicles()
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return
    
    try {
      await axios.delete(`/api/vehicles/${vehicleId}`)
      fetchVehicles()
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) {
    return <div className="page-loading">Loading vehicles...</div>
  }

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div>
          <h1>Vehicle Management</h1>
          <p>Manage vehicles and generate QR codes</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <FiPlus className="btn-icon" />
          Add Vehicle
        </button>
      </div>

      <div className="vehicles-grid">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="vehicle-card">
            <div className="vehicle-header">
              <div className="vehicle-plate">{vehicle.plate_number}</div>
              <span className={`vehicle-type-badge type-${vehicle.vehicle_type}`}>
                {vehicle.vehicle_type}
              </span>
            </div>
            
            <div className="vehicle-details">
              {vehicle.make && vehicle.model && (
                <div className="detail-item">
                  <span className="detail-label">Make/Model:</span>
                  <span className="detail-value">{vehicle.make} {vehicle.model}</span>
                </div>
              )}
              {vehicle.color && (
                <div className="detail-item">
                  <span className="detail-label">Color:</span>
                  <span className="detail-value">{vehicle.color}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Owner:</span>
                <span className="detail-value">{vehicle.owner_name}</span>
              </div>
            </div>

            <div className="vehicle-actions">
              <button
                className="btn-qr"
                onClick={() => handleViewQR(vehicle)}
              >
                <FiMaximize2 className="btn-icon-small" />
                View QR Code
              </button>
              <button
                className="btn-edit"
                onClick={() => handleEdit(vehicle)}
                title="Edit vehicle"
              >
                <FiEdit className="btn-icon-small" />
                Edit
              </button>
              {(currentUser?.role === 'admin' || vehicle.user_id === currentUser?.id) && (
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(vehicle.id)}
                  title="Delete vehicle"
                >
                  <FiTrash2 className="btn-icon-small" />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="empty-state">
          <p>No vehicles registered yet</p>
          <button className="btn-primary" onClick={handleCreate}>
            Add Your First Vehicle
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Plate Number *</label>
                <input
                  type="text"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  required
                  placeholder="ABC-1234"
                />
              </div>
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  required
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Make</label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="Toyota"
                />
              </div>
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Camry"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="Red"
                />
              </div>
              {currentUser?.role === 'admin' && (
                <div className="form-group">
                  <label>Owner</label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingVehicle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && selectedQR && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>QR Code - {selectedQR.plate_number}</h2>
            <div className="qr-display">
              <img 
                src={selectedQR.qr_code} 
                alt={`QR Code for ${selectedQR.plate_number}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            <p className="qr-hint">Scan this QR code at the gate to record entry/exit</p>
            <div className="qr-modal-actions">
              <button className="btn-primary" onClick={handleDownloadQR}>
                <FiDownload /> Download QR Code
              </button>
              <button className="btn-secondary" onClick={() => setShowQRModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vehicles


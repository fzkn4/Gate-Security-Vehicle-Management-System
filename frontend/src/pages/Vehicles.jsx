import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiPlus, FiEdit, FiTrash2, FiMaximize2, FiTruck, FiDownload, FiX, FiUpload, FiImage, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import './Vehicles.css'

const Vehicles = () => {
  const { user: currentUser } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedQR, setSelectedQR] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [deleteImageIds, setDeleteImageIds] = useState([])
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [lightboxImages, setLightboxImages] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
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
    setSelectedImages([])
    setImagePreviews([])
    setDeleteImageIds([])
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
    setSelectedImages([])
    setImagePreviews([])
    setDeleteImageIds([])
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedImages([])
    setImagePreviews([])
    setDeleteImageIds([])
    setIsUploading(false)
    setUploadProgress(0)
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

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    processFiles(files)
  }

  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB limit
      if (!isValidType) {
        alert(`File "${file.name}" is not a valid image`)
        return false
      }
      if (!isValidSize) {
        alert(`File "${file.name}" is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (selectedImages.length + validFiles.length > 5) {
      alert('Maximum 5 images allowed per vehicle')
      return
    }

    const newImages = [...selectedImages, ...validFiles]
    setSelectedImages(newImages)

    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (imageId) => {
    setDeleteImageIds(prev => [...prev, imageId])
  }

  const handleViewImages = (vehicle) => {
    const allImages = vehicle.images || []
    if (allImages.length > 0) {
      setLightboxImages(allImages.map(img => img.image_data))
      setCurrentImageIndex(0)
      setShowImageModal(true)
    }
  }

  const handleNavigateImage = (direction) => {
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % lightboxImages.length
      } else {
        return (prev - 1 + lightboxImages.length) % lightboxImages.length
      }
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      handleNavigateImage('next')
    } else if (e.key === 'ArrowLeft') {
      handleNavigateImage('prev')
    } else if (e.key === 'Escape') {
      setShowImageModal(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setIsUploading(true)
      setUploadProgress(0)

      const formDataToSend = new FormData()
      formDataToSend.append('plate_number', formData.plate_number)
      formDataToSend.append('vehicle_type', formData.vehicle_type)
      formDataToSend.append('make', formData.make)
      formDataToSend.append('model', formData.model)
      formDataToSend.append('color', formData.color)
      formDataToSend.append('user_id', formData.user_id)
      
      selectedImages.forEach(image => {
        formDataToSend.append('images', image)
      })
      
      if (editingVehicle) {
        formDataToSend.append('delete_images', JSON.stringify(deleteImageIds))
        await axios.put(`/api/vehicles/${editingVehicle.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        })
      } else {
        await axios.post('/api/vehicles', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        })
      }
      setShowModal(false)
      setIsUploading(false)
      setUploadProgress(0)
      fetchVehicles()
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
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
            
            <div className="vehicle-images-container">
              {vehicle.images && vehicle.images.length > 0 ? (
                <div className="vehicle-images">
                  <div 
                    className="vehicle-image-wrapper"
                    onClick={() => handleViewImages(vehicle)}
                  >
                    <img
                      src={vehicle.images[0].image_data}
                      alt={`Vehicle ${vehicle.plate_number}`}
                      className="vehicle-image-main"
                    />
                    <div className="image-overlay">
                      <FiImage className="overlay-icon" />
                      <span className="image-count">{vehicle.images.length} {vehicle.images.length === 1 ? 'image' : 'images'}</span>
                    </div>
                  </div>
                  {vehicle.images.length > 1 && (
                    <div className="vehicle-image-thumbnails">
                      {vehicle.images.slice(1, 4).map((image, idx) => (
                        <img
                          key={image.id}
                          src={image.image_data}
                          alt={`Vehicle ${vehicle.plate_number} ${idx + 2}`}
                          className="vehicle-image-thumb"
                          onClick={() => handleViewImages(vehicle)}
                        />
                      ))}
                      {vehicle.images.length > 4 && (
                        <div className="vehicle-image-more" onClick={() => handleViewImages(vehicle)}>
                          +{vehicle.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-images">
                  <FiImage className="no-images-icon" />
                  <span>No images</span>
                </div>
              )}
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <h2>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
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
              </div>
              <div className="form-row">
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
              </div>
              <div className="form-group">
                <label>Vehicle Images (Max 5, max 5MB each)</label>
                <div 
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="upload-input"
                    id="image-upload"
                    disabled={selectedImages.length >= 5}
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <FiUpload className="upload-icon" />
                    <span className="upload-text">
                      {dragOver ? 'Drop images here' : 'Drag & drop images here or click to browse'}
                    </span>
                    <span className="upload-subtext">
                      JPG, PNG, GIF up to 5MB each
                    </span>
                  </label>
                </div>
                {(imagePreviews.length > 0 || (editingVehicle && editingVehicle.images && editingVehicle.images.filter(img => !deleteImageIds.includes(img.id)).length > 0)) && (
                  <div className="image-previews">
                    {editingVehicle && editingVehicle.images && editingVehicle.images
                      .filter(img => !deleteImageIds.includes(img.id))
                      .map((image) => (
                        <div key={image.id} className="image-preview">
                          <img src={image.image_data} alt="Vehicle" />
                          <div className="image-actions">
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() => handleRemoveExistingImage(image.id)}
                              title="Remove image"
                            >
                              <FiX />
                            </button>
                          </div>
                        </div>
                      ))}
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="image-preview image-new">
                        <img src={preview} alt="New image" />
                        <div className="image-actions">
                          <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">Uploading... {uploadProgress}%</span>
                  </div>
                )}
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
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={isUploading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : (editingVehicle ? 'Update' : 'Create')}
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

      {showImageModal && lightboxImages.length > 0 && (
        <div 
          className="modal-overlay image-lightbox-overlay" 
          onClick={() => setShowImageModal(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lightbox-close" 
              onClick={() => setShowImageModal(false)}
              title="Close (Esc)"
            >
              <FiX />
            </button>
            
            {lightboxImages.length > 1 && (
              <button 
                className="lightbox-nav lightbox-prev" 
                onClick={() => handleNavigateImage('prev')}
                title="Previous image (←)"
              >
                <FiChevronLeft />
              </button>
            )}
            
            <div className="lightbox-image-container">
              <img 
                src={lightboxImages[currentImageIndex]} 
                alt={`Vehicle image ${currentImageIndex + 1}`}
                className="lightbox-image"
              />
              {lightboxImages.length > 1 && (
                <div className="lightbox-counter">
                  {currentImageIndex + 1} / {lightboxImages.length}
                </div>
              )}
            </div>
            
            {lightboxImages.length > 1 && (
              <button 
                className="lightbox-nav lightbox-next" 
                onClick={() => handleNavigateImage('next')}
                title="Next image (→)"
              >
                <FiChevronRight />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Vehicles



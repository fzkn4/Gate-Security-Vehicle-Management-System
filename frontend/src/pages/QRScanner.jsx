import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'
import { FiCamera, FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw, FiSettings, FiMoreVertical, FiX, FiClock, FiMapPin, FiTruck, FiShield, FiCheck, FiImage } from 'react-icons/fi'
import './QRScanner.css'

const QRScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState(null)
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorDetails, setErrorDetails] = useState('')
  const [errorLog, setErrorLog] = useState([])
  const [showErrorLog, setShowErrorLog] = useState(false)
  const [modalTimer, setModalTimer] = useState(null)
  const [countdown, setCountdown] = useState(10)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const menuRef = useRef(null)
  const countdownRef = useRef(null)

  // Function to get available cameras with proper labels
  const getCameras = async (requestPermission = false) => {
    try {
      // Request permission first to get proper camera labels
      if (requestPermission) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true })
        } catch (permErr) {
          console.error('Permission denied:', permErr)
          return
        }
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      // Map devices with better labels
      const cameraList = videoDevices.map((device, index) => ({
        id: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
        index: index
      }))
      
      setCameras(cameraList)
      
      // Set default camera (first one or previously selected)
      if (cameraList.length > 0 && !selectedCameraId) {
        const savedCameraId = localStorage.getItem('selectedCameraId')
        if (savedCameraId && cameraList.find(cam => cam.id === savedCameraId)) {
          setSelectedCameraId(savedCameraId)
        } else {
          setSelectedCameraId(cameraList[0].id)
        }
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err)
    }
  }

  // Get available cameras on component mount (without permission request)
  useEffect(() => {
    getCameras(false)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowCameraMenu(false)
      }
    }

    if (showCameraMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCameraMenu])

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setError('')
      setSuccess('')
      
      const html5QrCode = new Html5Qrcode("reader")
      html5QrCodeRef.current = html5QrCode

      // Use selected camera or fallback to facingMode
      let cameraConfig
      if (selectedCameraId) {
        cameraConfig = { deviceId: { exact: selectedCameraId } }
      } else {
        cameraConfig = { facingMode: "environment" }
      }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          // Remove qrbox to scan entire camera view
          // aspectRatio: 1.0 // Optional: maintain aspect ratio
        },
        (decodedText) => {
          console.log('QR Code decoded:', decodedText)
          handleScan(decodedText)
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      )
      
      setScanning(true)
    } catch (err) {
      setError('Failed to start camera. Please ensure camera permissions are granted.')
      console.error('Error starting scanner:', err)
    }
  }

  const handleCameraChange = async (cameraId) => {
    setSelectedCameraId(cameraId)
    localStorage.setItem('selectedCameraId', cameraId)
    setShowCameraMenu(false)
    
    // If currently scanning, restart with new camera
    if (scanning && html5QrCodeRef.current) {
      try {
        await stopScanning()
        // Small delay to ensure camera is released
        setTimeout(() => {
          startScanning()
        }, 300)
      } catch (err) {
        console.error('Error switching camera:', err)
      }
    }
  }

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
      setScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleScan = async (qrData) => {
    try {
      // Pause scanning to prevent multiple simultaneous scans
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.pause()
        } catch (pauseErr) {
          // Ignore pause errors
        }
      }
      
      setError('')
      setSuccess('')
      
      // Get current date/time from device (local time)
      // Create a date object and format it as ISO string with timezone offset
      const now = new Date()
      const timezoneOffset = -now.getTimezoneOffset() // Get offset in minutes
      const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60)
      const offsetMinutes = Math.abs(timezoneOffset) % 60
      const offsetSign = timezoneOffset >= 0 ? '+' : '-'
      const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
      
      // Format as ISO string with local timezone
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
      
      const deviceTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${offsetString}`
      
      console.log('Scanning QR code:', qrData)
      console.log('QR data length:', qrData.length)
      console.log('QR data starts with VEHICLE:', qrData.startsWith('VEHICLE:'))
      
      // Validate QR format before sending to backend
      if (!qrData || typeof qrData !== 'string') {
        throw new Error('Invalid QR code data')
      }
      
      if (!qrData.startsWith('VEHICLE:')) {
        throw new Error(`Invalid QR code format. Expected VEHICLE:... but got: ${qrData.substring(0, 30)}`)
      }
      
      // Check if QR data has enough content
      const parts = qrData.split(':')
      if (parts.length < 2) {
        throw new Error(`Invalid QR code format. Expected VEHICLE:ID:PLATE or VEHICLE:PLATE. Got: ${qrData.substring(0, 30)}`)
      }
      
      const response = await axios.post('/api/scan', {
        qr_data: qrData,
        location: 'Main Gate',
        timestamp: deviceTimestamp
      })
      
      setSuccess(response.data.message)
      setLastScan(response.data.entry)
      setScanCount(prev => prev + 1)
      
      // Clear any previous error
      setErrorDetails('')
      setShowErrorModal(false)
      
      // Show modal
      setShowResultModal(true)
      setCountdown(10)
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Set auto-close timer (10 seconds)
      if (modalTimer) {
        clearTimeout(modalTimer)
      }
      const timer = setTimeout(() => {
        setShowResultModal(false)
      }, 10000)
      setModalTimer(timer)
      
      // Resume scanning after successful scan
      if (html5QrCodeRef.current && scanning) {
        try {
          await html5QrCodeRef.current.resume()
        } catch (resumeErr) {
          // Ignore resume errors
        }
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process QR code'
      const errorTime = new Date()
      
      // Add to error log
      const newErrorLog = {
        id: Date.now(),
        message: errorMessage,
        qrData: qrData ? qrData.substring(0, 50) + (qrData.length > 50 ? '...' : '') : 'N/A',
        timestamp: errorTime.toISOString()
      }
      setErrorLog(prev => [newErrorLog, ...prev].slice(0, 50))
      
      // Just show "Invalid" in modal
      setErrorDetails('Invalid')
      setShowErrorModal(true)
      setCountdown(8)
      
      // Start countdown for error modal
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Auto-close error modal (8 seconds)
      if (modalTimer) {
        clearTimeout(modalTimer)
      }
      const timer = setTimeout(() => {
        setShowErrorModal(false)
      }, 8000)
      setModalTimer(timer)
      
      // Resume scanning on error
      if (html5QrCodeRef.current && scanning) {
        try {
          await html5QrCodeRef.current.resume()
        } catch (resumeErr) {
          // Ignore resume errors
        }
      }
    }
  }

  const closeResultModal = () => {
    setShowResultModal(false)
    if (modalTimer) {
      clearTimeout(modalTimer)
      setModalTimer(null)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const closeErrorModal = () => {
    setShowErrorModal(false)
    setErrorDetails('')
    if (modalTimer) {
      clearTimeout(modalTimer)
      setModalTimer(null)
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const clearErrorLog = () => {
    setErrorLog([])
    setShowErrorLog(false)
  }

  const deleteError = (errorId) => {
    setErrorLog(prev => prev.filter(error => error.id !== errorId))
  }

  useEffect(() => {
    return () => {
      if (modalTimer) {
        clearTimeout(modalTimer)
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
      }
    }
  }, [modalTimer])

  return (
    <div className="qr-scanner-page">
      <div className="page-header">
        <h1>QR Scanner</h1>
        <p>Scan vehicle QR codes</p>
      </div>

      <div className="scanner-container">
        <div className="scanner-section">
          <div className="scanner-status-bar">
            <div className="status-indicator">
              {scanning ? (
                <>
                  <div className="status-dot status-active"></div>
                  <span>Active</span>
                </>
              ) : (
                <>
                  <div className="status-dot status-inactive"></div>
                  <span>Inactive</span>
                </>
              )}
            </div>
            <div className="scanner-status-right">
              <div className="scan-count">
                <span>{scanCount} scan{scanCount !== 1 ? 's' : ''}</span>
              </div>
              {errorLog.length > 0 && (
                <button
                  className="error-log-btn"
                  onClick={() => setShowErrorLog(true)}
                  title={`View error log (${errorLog.length} errors)`}
                >
                  <FiAlertCircle />
                  <span className="error-count">{errorLog.length}</span>
                </button>
              )}
              <div className="camera-menu-wrapper" ref={menuRef}>
                <button 
                  className="camera-settings-btn"
                  onClick={async () => {
                    // Request permission and refresh camera list when opening menu
                    if (!showCameraMenu) {
                      await getCameras(true)
                    }
                    setShowCameraMenu(!showCameraMenu)
                  }}
                  title="Camera Settings"
                >
                  <FiMoreVertical className="settings-icon" />
                </button>
                {showCameraMenu && (
                  <div className="camera-menu">
                    <div className="camera-menu-header">
                      <FiSettings className="menu-icon" />
                      <span>Select Camera</span>
                    </div>
                    <div className="camera-menu-list">
                      {cameras.length === 0 ? (
                        <div className="camera-menu-item disabled">
                          <span>No cameras available</span>
                        </div>
                      ) : (
                        cameras.map((camera) => (
                          <button
                            key={camera.id}
                            className={`camera-menu-item ${selectedCameraId === camera.id ? 'active' : ''}`}
                            onClick={() => handleCameraChange(camera.id)}
                          >
                            <FiCamera className="camera-icon" />
                            <span className="camera-label">{camera.label}</span>
                            {selectedCameraId === camera.id && (
                              <div className="camera-check">✓</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="scanner-wrapper">
            <div id="reader" className="qr-reader"></div>
            {!scanning && (
              <div className="scanner-placeholder">
                <FiCamera className="placeholder-icon" />
                <p>Scanner inactive</p>
              </div>
            )}
          </div>

          <div className="scanner-controls">
            {!scanning ? (
              <button className="btn-primary" onClick={startScanning}>
                <FiCamera className="btn-icon" />
                Start
              </button>
            ) : (
              <button className="btn-danger" onClick={stopScanning}>
                <FiXCircle className="btn-icon" />
                Stop
              </button>
            )}
            {scanning && (
              <button className="btn-secondary" onClick={() => {
                stopScanning()
                setError('')
                setSuccess('')
                setLastScan(null)
              }}>
                <FiRefreshCw className="btn-icon" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {showResultModal && lastScan && (
        <div className="result-modal-overlay" onClick={closeResultModal}>
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrapper">
                  <FiCheck className="modal-icon" />
                </div>
                <div>
                  <h2>Scan Successful</h2>
                  <p className="modal-subtitle">{success}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeResultModal}>
                <FiX />
              </button>
            </div>

            <div className="scan-details">
              <div className="vehicle-image-container">
                {lastScan.vehicle_image && lastScan.vehicle_image.length > 0 ? (
                  <img 
                    src={lastScan.vehicle_image} 
                    alt={`${lastScan.plate_number} - Vehicle`}
                    className="vehicle-image"
                    loading="eager"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <FiImage className="no-image-icon" />
                    <span className="no-image-text">No Vehicle Image</span>
                  </div>
                )}
              </div>

              <div className="main-info-card">
                <div className={`entry-type-badge entry-type-${lastScan.entry_type}`}>
                  <div className="entry-type-icon">
                    {lastScan.entry_type === 'in' ? <FiCheckCircle /> : <FiXCircle />}
                  </div>
                  <div className="entry-type-text">
                    <span className="entry-type-label">
                      {lastScan.entry_type === 'in' ? 'ENTRY' : 'EXIT'}
                    </span>
                    <span className="entry-type-time">
                      {new Date(lastScan.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="plate-number-display">
                  <FiShield className="plate-icon" />
                  <span className="plate-number">{lastScan.plate_number}</span>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <FiTruck className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Vehicle Type</span>
                    <span className="info-value">{lastScan.vehicle_type}</span>
                  </div>
                </div>

                <div className="info-card">
                  <FiShield className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Owner</span>
                    <span className="info-value">{lastScan.owner_name}</span>
                  </div>
                </div>

                <div className="info-card">
                  <FiClock className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Date & Time</span>
                    <span className="info-value">{new Date(lastScan.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="info-card">
                  <FiMapPin className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Location</span>
                    <span className="info-value">{lastScan.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="countdown-indicator">
                <div className="countdown-bar" style={{ width: `${(countdown / 10) * 100}%` }}></div>
              </div>
              <button className="btn-primary" onClick={closeResultModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="error-modal-overlay" onClick={closeErrorModal}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-header-error">
              <div className="modal-title-group">
                <div className="modal-icon-wrapper modal-icon-wrapper-error">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <div>
                  <h2>Scan Failed</h2>
                  <p className="modal-subtitle">Unable to process QR code</p>
                </div>
              </div>
              <button className="modal-close-btn modal-close-btn-error" onClick={closeErrorModal}>
                <FiX />
              </button>
            </div>

            <div className="error-details">
              <div className="error-icon-wrapper">
                <FiXCircle className="error-icon" />
              </div>
              <p className="error-message">{errorDetails}</p>
              <p className="error-subtitle">Invalid QR code detected</p>
            </div>

            <div className="modal-footer">
              <div className="countdown-indicator">
                <div className="countdown-bar countdown-bar-error" style={{ width: `${(countdown / 8) * 100}%` }}></div>
              </div>
              <button className="btn-primary" onClick={closeErrorModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorLog && (
        <div className="error-log-overlay" onClick={() => setShowErrorLog(false)}>
          <div className="error-log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-wrapper">
                  <FiAlertCircle className="modal-icon" />
                </div>
                <div>
                  <h2>Error Log</h2>
                  <p className="modal-subtitle">{errorLog.length} error{errorLog.length !== 1 ? 's' : ''} recorded</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowErrorLog(false)}>
                <FiX />
              </button>
            </div>

            <div className="error-log-content">
              {errorLog.length === 0 ? (
                <div className="no-errors">
                  <FiCheckCircle className="no-errors-icon" />
                  <p>No errors recorded</p>
                </div>
              ) : (
                <div className="error-log-list">
                  {errorLog.map((error) => (
                    <div key={error.id} className="error-log-item">
                      <div className="error-log-header">
                        <div className="error-log-time">
                          <FiClock />
                          <span>{new Date(error.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="error-log-actions">
                          <div className="error-log-id">#{error.id}</div>
                          <button
                            className="error-delete-btn"
                            onClick={() => deleteError(error.id)}
                            title="Delete this error"
                          >
                            <FiX />
                          </button>
                        </div>
                      </div>
                      <div className="error-log-message">
                        <strong>Error:</strong> {error.message}
                      </div>
                      <div className="error-log-qrcode">
                        <strong>QR Data:</strong> {error.qrData}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => {
                setErrorLog([])
                setShowErrorLog(false)
              }}>
                Clear Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner


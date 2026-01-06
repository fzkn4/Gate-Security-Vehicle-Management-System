import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import axios from 'axios'
import { FiCamera, FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import './QRScanner.css'

const QRScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanCount, setScanCount] = useState(0)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

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

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Remove qrbox to scan entire camera view
          // aspectRatio: 1.0 // Optional: maintain aspect ratio
        },
        (decodedText) => {
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
      
      // Get the current date/time from the device (local time)
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
      
      const response = await axios.post('/api/scan', {
        qr_data: qrData,
        location: 'Main Gate',
        timestamp: deviceTimestamp
      })
      
      setSuccess(response.data.message)
      setLastScan(response.data.entry)
      setScanCount(prev => prev + 1)
      
      // Stop scanning after successful scan
      await stopScanning()
      
      // Auto-restart after 2 seconds
      setTimeout(() => {
        startScanning()
      }, 2000)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process QR code')
      console.error('Error scanning:', err)
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

  return (
    <div className="qr-scanner-page">
      <div className="page-header">
        <h1>QR Code Scanner</h1>
        <p>Scan vehicle QR codes to record entry and exit</p>
      </div>

      <div className="scanner-container">
        <div className="scanner-section">
          <div className="scanner-status-bar">
            <div className="status-indicator">
              {scanning ? (
                <>
                  <div className="status-dot status-active"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <div className="status-dot status-inactive"></div>
                  <span>Scanner Inactive</span>
                </>
              )}
            </div>
            <div className="scan-count">
              <span>Scans Today: {scanCount}</span>
            </div>
          </div>

          <div className="scanner-wrapper">
            <div id="reader" className="qr-reader"></div>
            {!scanning && (
              <div className="scanner-placeholder">
                <FiCamera className="placeholder-icon" />
                <p>Camera not active</p>
                <p className="placeholder-hint">Click "Start Scanner" to begin</p>
              </div>
            )}
          </div>

          <div className="scanner-controls">
            {!scanning ? (
              <button className="btn-primary" onClick={startScanning}>
                <FiCamera className="btn-icon" />
                Start Scanner
              </button>
            ) : (
              <button className="btn-danger" onClick={stopScanning}>
                <FiXCircle className="btn-icon" />
                Stop Scanner
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

        <div className="scan-results">
          <div className="results-card">
            <h2>Scan Results</h2>
            
            {error && (
              <div className="alert alert-error">
                <FiAlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <FiCheckCircle className="alert-icon" />
                <span>{success}</span>
              </div>
            )}

            {lastScan && (
              <div className="scan-details">
                <div className="detail-row">
                  <span className="detail-label">Plate Number:</span>
                  <span className="detail-value">{lastScan.plate_number}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Vehicle Type:</span>
                  <span className="detail-value">{lastScan.vehicle_type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Owner:</span>
                  <span className="detail-value">{lastScan.owner_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Entry Type:</span>
                  <span className={`detail-value entry-type-${lastScan.entry_type}`}>
                    {lastScan.entry_type.toUpperCase()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {new Date(lastScan.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{lastScan.location}</span>
                </div>
              </div>
            )}

            {!error && !success && !lastScan && (
              <div className="empty-results">
                <p>No scans yet</p>
                <p className="hint">Start the scanner and scan a QR code</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRScanner


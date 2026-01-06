import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiSettings, FiUser, FiMail, FiLock, FiSave, FiRotateCcw } from 'react-icons/fi'
import './Settings.css'

const Settings = () => {
  const { user, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setMessage({ type: '', text: '' })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const updateData = {
        full_name: formData.full_name,
        email: formData.email
      }

      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          setMessage({ type: 'error', text: 'New passwords do not match' })
          setLoading(false)
          return
        }
        if (!formData.current_password) {
          setMessage({ type: 'error', text: 'Current password is required to change password' })
          setLoading(false)
          return
        }
        updateData.password = formData.new_password
      }

      await axios.put(`/api/users/${user.id}`, updateData)
      setMessage({ type: 'success', text: 'Settings saved successfully' })
      
      // Clear password fields
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save settings' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>User Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h2 className="section-title">
            <FiUser className="section-icon" />
            Personal Information
          </h2>
          
          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>
                <FiUser className="input-icon" />
                Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiMail className="input-icon" />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <h2 className="section-title">
              <FiLock className="section-icon" />
              Change Password
            </h2>

            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                Current Password
              </label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleInputChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Confirm new password"
              />
            </div>

            {message.text && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleReset}
                disabled={loading}
              >
                <FiRotateCcw className="btn-icon" />
                Reset
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                <FiSave className="btn-icon" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings


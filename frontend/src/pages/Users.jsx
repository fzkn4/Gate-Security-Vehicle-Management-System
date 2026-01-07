import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiUserPlus, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi'
import './Users.css'

const Users = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'user'
  })

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers()
    }
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      full_name: '',
      password: '',
      role: 'user'
    })
    setShowModal(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    // Only include email if user is admin (regular users have placeholder emails)
    setFormData({
      username: user.username,
      email: user.role === 'admin' ? (user.email || '') : '',
      full_name: user.full_name,
      password: '',
      role: user.role
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Prepare data based on role
      const submitData = { ...formData }
      
      // If role is 'user', don't send email and password
      if (submitData.role === 'user') {
        delete submitData.email
        delete submitData.password
      }
      
      // If editing and password is empty, don't send it
      if (editingUser && !submitData.password) {
        delete submitData.password
      }
      
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, submitData)
      } else {
        await axios.post('/api/auth/register', submitData)
      }
      setShowModal(false)
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    
    try {
      await axios.delete(`/api/users/${userId}`)
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed')
    }
  }

  if (currentUser?.role !== 'admin') {
    return <div className="unauthorized">Unauthorized access</div>
  }

  if (loading) {
    return <div className="page-loading">Loading users...</div>
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage system users and their permissions</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <FiUserPlus className="btn-icon" />
          Add User
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Vehicles</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.full_name}</td>
                <td>{user.email || (user.role === 'admin' ? '-' : 'N/A')}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.vehicle_count || 0}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(user)}
                      title="Edit user"
                    >
                      <FiEdit />
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(user.id)}
                        title="Delete user"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const newRole = e.target.value
                    // Clear email and password when switching to user role
                    if (newRole === 'user') {
                      setFormData({ ...formData, role: newRole, email: '', password: '' })
                    } else {
                      setFormData({ ...formData, role: newRole })
                    }
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              {formData.role === 'admin' && (
                <>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password {editingUser && '(leave blank to keep current)'}</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users


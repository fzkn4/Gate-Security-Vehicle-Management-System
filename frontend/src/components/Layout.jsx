import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  FiBarChart2, 
  FiCamera, 
  FiTruck, 
  FiClock, 
  FiUsers, 
  FiSettings, 
  FiLogOut,
  FiUser,
  FiBell
} from 'react-icons/fi'
import './Layout.css'

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: FiBarChart2 },
    { path: '/scanner', label: 'QR Scanner', icon: FiCamera },
    { path: '/vehicles', label: 'Vehicles', icon: FiTruck },
    { path: '/history', label: 'History', icon: FiClock },
  ]

  if (user?.role === 'admin') {
    menuItems.splice(3, 0, { path: '/users', label: 'Users', icon: FiUsers })
  }
  
  menuItems.push({ path: '/settings', label: 'Settings', icon: FiSettings })

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <div className="logo-icon-wrapper">
              <FiTruck className="logo-icon" />
            </div>
            <span className="logo-text">Gate Security</span>
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">
              <FiBell />
            </button>
            <div className="user-avatar">
              <FiUser />
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <IconComponent className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="sidebar-footer">
            <button className="nav-item" onClick={logout}>
              <FiLogOut className="nav-icon" />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout


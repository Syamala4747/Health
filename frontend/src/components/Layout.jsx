import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Chip,
  Paper,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Psychology,
  VideoCall,
  Analytics,
  Settings,
  Logout,
  Notifications,
  Help,
  AccountCircle,
  Brightness4,
  Brightness7,
  Security,
  Storage,
  VpnKey,
  CleaningServices,
  Build,
  HowToReg,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext.jsx'

const drawerWidth = 280 // Increased for better spacing and modern look

const getMenuItems = (userRole) => {
  const baseItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: `/${userRole}` },
  ]

  if (userRole === 'admin') {
    return [
      ...baseItems,
      { text: 'User Approval', icon: <HowToReg />, path: '/admin/user-approval' },
      { text: 'Reports', icon: <Security />, path: '/admin/reports' },
    ]
  } else if (userRole === 'college_head') {
    return [
      ...baseItems,
      { text: 'Students Management', icon: <People />, path: '/college-head/students-management' },
      { text: 'Counsellors Management', icon: <Psychology />, path: '/college-head/counsellors-management' },
      { text: 'Analytics', icon: <Analytics />, path: '/college-head/analytics' },
      { text: 'Reports & Issues', icon: <Security />, path: '/college-head/reports' },
      { text: 'Profile', icon: <Settings />, path: '/college-head/profile' },
    ]
  } else if (userRole === 'counsellor') {
    return [
      ...baseItems,
      { text: 'My Students', icon: <People />, path: '/counsellor/students' },
      { text: 'Chat', icon: <Psychology />, path: '/counsellor/chat' },
      { text: 'Profile', icon: <Settings />, path: '/counsellor/profile' },
    ]
  } else if (userRole === 'student') {
    return [
      ...baseItems,
      { text: 'Resources', icon: <Psychology />, path: '/student/resources' },
      { text: 'Profile', icon: <Settings />, path: '/student/profile' },
    ]
  }

  return baseItems
}

export default function Layout({ userRole }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
    handleProfileMenuClose()
  }

  const menuItems = getMenuItems(userRole)
  
  const getAppTitle = (role) => {
    switch (role) {
      case 'admin': return 'ZenCare Admin'
      case 'college_head': return 'ZenCare College Head'
      case 'counsellor': return 'ZenCare Counsellor'
      case 'student': return 'ZenCare Student'
      default: return 'ZenCare'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      case 'counsellor': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      case 'student': return 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)'
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: getRoleColor(userRole),
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Modern gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)',
          zIndex: 1,
        }}
      />
      
      {/* Header section */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2,
        p: 3,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'white', 
            fontWeight: 700,
            textAlign: 'center',
            mb: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          ZenCare
        </Typography>
        <Chip
          label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          sx={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'block',
            margin: '0 auto',
            width: 'fit-content',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
      </Box>

      {/* Navigation Menu */}
      <List sx={{ position: 'relative', zIndex: 2, px: 2, py: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                color: 'white',
                py: 1.5,
                px: 2,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.15)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'white',
                  minWidth: 48,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.5rem'
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '1rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Bottom user info */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          color: 'white',
          px: 1
        }}>
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              width: 40,
              height: 40,
              mr: 2,
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.displayName || user?.email?.split('@')[0]}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                display: 'block'
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Enhanced AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          height: 80, // Increased height
        }}
      >
        <Toolbar sx={{ height: 80, px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              background: 'rgba(255,255,255,0.1)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                mb: 0.5
              }}
            >
              {getAppTitle(userRole)}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9,
                fontSize: '0.95rem'
              }}
            >
              Dashboard & Management Portal
            </Typography>
          </Box>

          {/* Enhanced notification and profile section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              sx={{ 
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton 
              sx={{ 
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <Help />
            </IconButton>

            <Box 
              onClick={handleProfileMenuOpen} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 2,
                px: 2,
                py: 1,
                ml: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  width: 44,
                  height: 44,
                  mr: 1.5,
                  border: '2px solid rgba(255,255,255,0.2)',
                  fontSize: '1.2rem',
                  fontWeight: 600
                }}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.displayName || user?.email?.split('@')[0]}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, lineHeight: 1.2 }}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '& .MuiMenuItem-root': {
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)',
                    }
                  }
                }
              }}
            >
              <MenuItem onClick={handleProfileMenuClose}>
                <AccountCircle sx={{ mr: 2 }} />
                Profile Settings
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>
                <Settings sx={{ mr: 2 }} />
                Preferences
              </MenuItem>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Toolbar sx={{ height: 80 }} />
        <Outlet />
        
        {/* AI Student Guide - Temporarily disabled */}
        {/* {userRole === 'student' && <AIStudentGuide />} */}
      </Box>
    </Box>
  )
}
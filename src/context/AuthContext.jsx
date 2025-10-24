import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock database of registered users
  const registeredUsers = [
    // Participants/Students
    {
      id: 1,
      username: 'participant1',
      email: 'participant1@example.com',
      password: 'password123',
      role: 'participant',
      name: 'John Doe',
      department: 'Computer Science',
      college: 'Saranathan College of Engineering'
    },
    {
      id: 2,
      username: 'student1',
      email: 'student1@saranathan.edu',
      password: 'student123',
      role: 'participant',
      name: 'Alice Johnson',
      department: 'Information Technology',
      college: 'Saranathan College of Engineering'
    },
    {
      id: 3,
      username: 'researcher1',
      email: 'researcher1@mit.edu',
      password: 'research123',
      role: 'participant',
      name: 'Dr. Robert Chen',
      department: 'Artificial Intelligence',
      college: 'MIT Chennai'
    },
    
    // Admin
    {
      id: 4,
      username: 'admin',
      email: 'admin@saranathan.edu',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
      department: 'Administration',
      college: 'Saranathan College of Engineering'
    },
    
    // Evaluators
    {
      id: 5,
      username: 'evaluator1',
      email: 'sarah.wilson@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Sarah Wilson',
      department: 'Computer Science',
      expertise: ['AI', 'Machine Learning', 'Healthcare', 'Data Science']
    },
    {
      id: 6,
      username: 'evaluator2',
      email: 'kumar.singh@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Prof. Kumar Singh',
      department: 'Cybersecurity',
      expertise: ['Cybersecurity', 'Cloud Computing', 'Networks', 'Blockchain']
    },
    {
      id: 7,
      username: 'evaluator3',
      email: 'anita.sharma@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Anita Sharma',
      department: 'Mechanical Engineering',
      expertise: ['Robotics', 'Manufacturing', 'Automation', 'Industry 4.0']
    },
    {
      id: 8,
      username: 'evaluator4',
      email: 'priya.nair@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Dr. Priya Nair',
      department: 'Electronics',
      expertise: ['Telecommunications', '5G', 'Wireless Networks', 'Signal Processing']
    },
    {
      id: 9,
      username: 'evaluator5',
      email: 'raj.patel@saranathan.edu',
      password: 'eval123',
      role: 'evaluator',
      name: 'Prof. Raj Patel',
      department: 'Agricultural Engineering',
      expertise: ['IoT', 'Agriculture', 'Sensors', 'Smart Farming']
    }
  ]

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (credentials) => {
    const { username, password, role } = credentials
    
    // Find user in registered users
    const foundUser = registeredUsers.find(user => 
      (user.username === username || user.email === username) && 
      user.password === password &&
      user.role === role
    )

    if (foundUser) {
      const userSession = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        name: foundUser.name,
        loginTime: new Date().toISOString()
      }
      
      setUser(userSession)
      localStorage.setItem('user', JSON.stringify(userSession))
      return { success: true, user: userSession }
    } else {
      return { success: false, error: 'Invalid credentials or role mismatch' }
    }
  }

  const register = (userData) => {
    // Check if user already exists
    const existingUser = registeredUsers.find(user => 
      user.username === userData.username || user.email === userData.email
    )

    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    // Add new user to mock database (in real app, this would be an API call)
    const newUser = {
      id: registeredUsers.length + 1,
      ...userData,
      role: 'participant' // New registrations are always participants
    }
    
    registeredUsers.push(newUser)
    
    return { success: true, message: 'Registration successful! Please login.' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const isAuthenticated = () => {
    return user !== null
  }

  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole
  }

  const canAccessDashboard = () => {
    return user && user.role === 'participant'
  }

  const canAccessEvaluatorDashboard = () => {
    return user && user.role === 'evaluator'
  }

  const canAccessAdminDashboard = () => {
    return user && user.role === 'admin'
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    canAccessDashboard,
    canAccessEvaluatorDashboard,
    canAccessAdminDashboard,
    registeredUsers // For demo purposes
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UploadPaper from './pages/UploadPaper'
import MyPapers from './pages/MyPapers'
import EvaluatorDashboard from './pages/EvaluatorDashboard'
import EvaluatePapers from './pages/EvaluatePapers'
import AdminDashboard from './pages/AdminDashboard'
import AdminPapers from './pages/AdminPapers'
import AdminEvaluators from './pages/AdminEvaluators'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload-paper" 
          element={
            <ProtectedRoute>
              <UploadPaper />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-papers" 
          element={
            <ProtectedRoute>
              <MyPapers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/evaluator-dashboard" 
          element={
            <ProtectedRoute requiredRole="evaluator">
              <EvaluatorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/evaluate-papers" 
          element={
            <ProtectedRoute requiredRole="evaluator">
              <EvaluatePapers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-papers" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPapers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-evaluators" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEvaluators />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  )
}

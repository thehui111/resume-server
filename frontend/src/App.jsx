import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ResumeList from './pages/ResumeList'
import ResumeEditor from './pages/ResumeEditor'

function RequireAuth({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resumes" element={<RequireAuth><ResumeList /></RequireAuth>} />
        <Route path="/resumes/:id" element={<RequireAuth><ResumeEditor /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/resumes" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

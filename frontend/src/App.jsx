import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import About from './pages/About'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import EditorPage from './pages/Editor'

function App() {
  return (
    <Router>
   
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App

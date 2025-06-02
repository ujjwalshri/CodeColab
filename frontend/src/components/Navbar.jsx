import React from 'react'
import { FaLinkedin } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <div>
    <div className="navbar bg-base-100">
  <div className="navbar-start">
  <div className="navbar-center">
    <Link to='/' className="btn btn-ghost text-xl">CodeColab</Link>
  </div>
  </div>
 
  <div className="navbar-end">
    <button 
          onClick={() => navigate('/about')}
          className="btn btn-ghost mr-2"
        >
          About
        </button>
    <div>
        <a href="https://www.linkedin.com/in/ujjwal-shrivastava-2a6138268/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-circle">
            <FaLinkedin className="h-5 w-5 text-black-600" />
        </a>
    </div>
  </div>
</div>
    </div>
  )
}

export default Navbar
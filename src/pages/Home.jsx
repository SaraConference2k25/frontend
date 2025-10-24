import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import bgImage from '../assets/bg.jpg'

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')

  const handleNavClick = (section) => {
    setActiveSection(section)
    // Only scroll if not already at the top or if content is not visible
    const navbar = document.querySelector('.main-navbar')
    if (navbar && window.scrollY > navbar.offsetTop) {
      // Scroll to show navbar but keep logo visible
      navbar.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'registration':
        return (
          <div className="instruction-content">
            <h2>Registration Instructions</h2>
            <div className="instruction-steps">
              <h3>How to Register for the Conference</h3>
              <ol>
                <li><strong>Create an Account:</strong> Click on the "Sign In" or "Signup" button below to create your account.</li>
                <li><strong>Fill Personal Details:</strong> Complete your profile with accurate information including your academic affiliation.</li>
                <li><strong>Choose Registration Type:</strong> Select from Student, Faculty, or Industry Professional categories.</li>
                <li><strong>Payment:</strong> Complete the registration fee payment through our secure payment gateway.</li>
                <li><strong>Confirmation:</strong> You will receive a confirmation email with your registration details.</li>
              </ol>
              <div className="important-note">
                <h4>Important Information:</h4>
                <ul>
                  <li>Early bird registration closes on November 15, 2025</li>
                  <li>Student discounts available with valid ID verification</li>
                  <li>Group registration discounts for 5+ participants from same institution</li>
                </ul>
              </div>
            </div>
          </div>
        )
      case 'submission':
        return (
          <div className="instruction-content">
            <h2>Paper Submission Guidelines</h2>
            <div className="instruction-steps">
              <h3>How to Submit Your Research Paper</h3>
              <ol>
                <li><strong>Prepare Your Paper:</strong> Format your paper according to the conference template (IEEE format).</li>
                <li><strong>Login to Portal:</strong> Access the submission system through your registered account.</li>
                <li><strong>Upload Documents:</strong> Submit your paper in PDF format along with any supplementary materials.</li>
                <li><strong>Complete Metadata:</strong> Fill in all required fields including title, abstract, keywords, and author information.</li>
                <li><strong>Review and Submit:</strong> Carefully review all information before final submission.</li>
              </ol>
              <div className="important-note">
                <h4>Submission Requirements:</h4>
                <ul>
                  <li>Maximum 6 pages for full papers, 4 pages for short papers</li>
                  <li>Papers must be original and not published elsewhere</li>
                  <li>Submission deadline: December 1, 2025</li>
                  <li>All papers will undergo double-blind peer review</li>
                </ul>
              </div>
            </div>
          </div>
        )
      case 'publication':
        return (
          <div className="instruction-content">
            <h2>Publication Information</h2>
            <div className="instruction-steps">
              <h3>Publication Process</h3>
              <ol>
                <li><strong>Peer Review:</strong> All submitted papers undergo rigorous double-blind peer review.</li>
                <li><strong>Notification:</strong> Authors will be notified of acceptance/rejection by January 15, 2026.</li>
                <li><strong>Camera-Ready Submission:</strong> Accepted papers must be revised according to reviewer comments.</li>
                <li><strong>Copyright Transfer:</strong> Complete the copyright transfer form for final publication.</li>
                <li><strong>Conference Proceedings:</strong> Accepted papers will be published in the conference proceedings.</li>
              </ol>
              <div className="important-note">
                <h4>Publication Details:</h4>
                <ul>
                  <li>Proceedings will be published with ISBN</li>
                  <li>Selected papers may be invited for journal publication</li>
                  <li>Digital proceedings will be available online</li>
                  <li>Best paper awards will be announced during the conference</li>
                </ul>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="instruction-content">
            <h1>Welcome to the National Conference Portal</h1>
            <p>Your comprehensive gateway to academic excellence, resources, and campus life. Join our community of learners and innovators.</p>
            <div className="buttons">
              <Link to="/login" className="btn">Sign In</Link>
              <Link to="/register" className="btn btn-secondary">Signup</Link>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      <header className="top-header">
        <img src={bgImage} alt="Saranathan College of Engineering - Excellence in Education" />
      </header>
      
      {/* Navigation Bar */}
      <nav className="main-navbar">
        <div className="navbar-container">
          <ul className="navbar-menu">
            <li className="nav-item">
              <button 
                onClick={() => handleNavClick('home')} 
                className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              >
                Home
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => handleNavClick('registration')} 
                className={`nav-link ${activeSection === 'registration' ? 'active' : ''}`}
              >
                Registration
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => handleNavClick('submission')} 
                className={`nav-link ${activeSection === 'submission' ? 'active' : ''}`}
              >
                Submission
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => handleNavClick('publication')} 
                className={`nav-link ${activeSection === 'publication' ? 'active' : ''}`}
              >
                Publication
              </button>
            </li>
          </ul>
          <div className="navbar-login">
            <Link to="/login" className="btn btn-login">Login</Link>
          </div>
        </div>
      </nav>
      
      <div id="index-page">
        <main id="content-section">
          {renderContent()}
        </main>
      </div>
    </>
  )
}

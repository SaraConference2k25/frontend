import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import bgImage from '../assets/bg.jpg'

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')

  const handleNavClick = (section) => {
    setActiveSection(section)
    
    // If "dates" is clicked, scroll to important dates section
    if (section === 'dates') {
      // First set to home to show the content
      setActiveSection('home')
      // Wait for content to render, then scroll to dates
      setTimeout(() => {
        const datesSection = document.getElementById('important-dates-section')
        if (datesSection) {
          const yOffset = -100; // Offset to show title properly
          const y = datesSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100)
    } else {
      // For other sections, scroll to navbar
      const navbar = document.querySelector('.main-navbar')
      if (navbar && window.scrollY > navbar.offsetTop) {
        navbar.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
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
      case 'contacts':
        return (
          <div className="instruction-content">
            <h1>Contact Information</h1>
            <p className="hero-subtitle">Get in Touch with Us</p>
            
            {/* Contact Details */}
            <section className="home-section">
              <h2>Conference Secretariat</h2>
              <p>
                <strong>Saranathan College of Engineering</strong><br/>
                Panjappur, Trichy - 620012<br/>
                Tamil Nadu, India
              </p>
              <p>
                <strong>Email:</strong> conference@saranathan.ac.in<br/>
                <strong>Phone:</strong> +91-431-2760801, 2760802<br/>
                <strong>Website:</strong> www.saranathan.ac.in
              </p>
            </section>

            {/* Contact Person */}
            <section className="home-section">
              <h2>For General Inquiries</h2>
              <p>
                <strong>Dr. Conference Chair</strong><br/>
                Email: chair@saraconference.ac.in<br/>
                Phone: +91-XXXXX-XXXXX
              </p>
            </section>

            {/* Paper Submission Queries */}
            <section className="home-section">
              <h2>For Paper Submission Queries</h2>
              <p>
                <strong>Technical Program Committee</strong><br/>
                Email: papers@saraconference.ac.in<br/>
                Phone: +91-XXXXX-XXXXX
              </p>
            </section>

            {/* Registration Queries */}
            <section className="home-section">
              <h2>For Registration Queries</h2>
              <p>
                <strong>Registration Desk</strong><br/>
                Email: registration@saraconference.ac.in<br/>
                Phone: +91-XXXXX-XXXXX
              </p>
            </section>
          </div>
        )
      default:
        return (
          <div className="instruction-content">
            <h1>SARA 2025 National Conference</h1>
            <p className="hero-subtitle">Advancing Research and Academic Excellence</p>
            
            {/* About Section */}
            <section className="home-section">
              <h2>About the Conference</h2>
              <p>
                SARA 2025 brings together leading researchers, academicians, and industry professionals 
                to share groundbreaking research and innovative ideas. This conference serves as a platform 
                for intellectual exchange and collaboration across various disciplines of engineering, 
                technology, and applied sciences.
              </p>
            </section>

            {/* Important Dates */}
            <section className="home-section" id="important-dates-section">
              <h2>Important Dates</h2>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td><strong>Registration Opens</strong></td>
                    <td>January 20, 2026</td>
                  </tr>
                  <tr>
                    <td><strong>Paper Submission Deadline</strong></td>
                    <td>February 20, 2025</td>
                  </tr>
                  <tr>
                    <td><strong>Acceptance Notification</strong></td>
                    <td>March 1, 2026</td>
                  </tr>
                  <tr>
                    <td><strong>Camera-Ready Submission</strong></td>
                    <td>March 30, 2026</td>
                  </tr>
                  <tr>
                    <td><strong>Conference Dates</strong></td>
                    <td>April 3 & 4, 2026</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* Conference Tracks */}
            <section className="home-section">
              <h2>Conference Tracks</h2>
              <ul className="tracks-list">
                <li><strong>Computing:</strong> Machine Learning, Deep Learning, Computer Vision, Natural Language Processing</li>
                <li><strong>Electronics & Communications:</strong> IoT, Wireless Networks, Signal Processing, VLSI Design</li>
              </ul>
            </section>

            {/* Venue */}
            <section className="home-section">
              <h2>Venue</h2>
              <p>
                <strong>Saranathan College of Engineering</strong><br/>
                Trichy - 620012, Tamil Nadu, India
              </p>
              <p>
                The conference will be held at our state-of-the-art campus facilities, 
                providing an ideal environment for academic discourse and professional networking.
              </p>
            </section>

            {/* Registration Info */}
            <section className="home-section">
              <h2>Registration</h2>
              <p>
                Registration categories include Students, Faculty, Research Scholars, and Industry Professionals. 
                Early bird discounts are available. Group registrations from the same institution receive special rates.
              </p>
              <p>
                <strong>Note:</strong> At least one author of each accepted paper must register for the conference.
              </p>
            </section>

            {/* Call to Action */}
            <div className="buttons">
              <Link to="/login" className="btn btn-primary">Sign In</Link>
              <Link to="/register" className="btn btn-secondary">Sign Up</Link>
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
                onClick={() => handleNavClick('dates')} 
                className={`nav-link ${activeSection === 'dates' ? 'active' : ''}`}
              >
                Dates
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
            <li className="nav-item">
              <button 
                onClick={() => handleNavClick('contacts')} 
                className={`nav-link ${activeSection === 'contacts' ? 'active' : ''}`}
              >
                Contacts
              </button>
            </li>
          </ul>
          <div className="navbar-login">
            <Link to="/login" className="btn btn-login">Login</Link>
          </div>
        </div>
      </nav>
      
      {/* Marquee Announcement */}
      <div className="announcement-marquee">
        <marquee behavior="scroll" direction="left" scrollamount="8">
          🎉 The Registration for Conference will start from January 1 🎉
        </marquee>
      </div>
      
      <div id="index-page">
        <main id="content-section">
          {renderContent()}
        </main>
      </div>
    </>
  )
}

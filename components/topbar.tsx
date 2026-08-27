'use client'

export default function Topbar() {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <span className="logo">
          MAG<span className="logo-dot">.</span>
        </span>
        <div className="nav-links">
          <a href="/join-team" className="nav-link">
            Join the Team
          </a>
          <a href="https://miamiapartmentguy.com/agent" className="nav-link">
            Agent Login
          </a>
        </div>
      </div>
      <style jsx>{`
        .topnav {
          width: 100%;
          padding: 14px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .topnav-inner {
          max-width: 1160px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: #f7f8fb;
        }
        .logo-dot {
          color: #ff3d82;
        }
        .nav-links {
          display: flex;
          gap: 22px;
        }
        .nav-link {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          font-weight: 600;
          color: #7c86a0;
          text-decoration: none;
          letter-spacing: 0.02em;
        }
        .nav-link:hover {
          color: #f7f8fb;
        }
        @media (max-width: 768px) {
          .topnav {
            padding: 10px 16px;
          }
          .logo {
            font-size: 15px;
          }
          .nav-links {
            gap: 14px;
          }
          .nav-link {
            font-size: 11px;
          }
        }
      `}</style>
    </header>
  )
}

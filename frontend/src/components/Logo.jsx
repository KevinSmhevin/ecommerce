const Logo = ({ className = "", size = "default" }) => {
  const iconSize = size === "large" ? 56 : size === "small" ? 32 : 40
  const textSize = size === "large" ? "text-3xl" : size === "small" ? "text-xl" : "text-2xl"
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Pokeball Icon with retro game style */}
      <div className="relative">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          {/* Outer circle shadow */}
          <circle cx="20" cy="20" r="19" fill="#1F1F1F" opacity="0.1" />
          {/* Top half - red with gradient effect */}
          <path
            d="M20 0C8.954 0 0 8.954 0 20C0 31.046 8.954 40 20 40C31.046 40 40 31.046 40 20C40 8.954 31.046 0 20 0Z"
            fill="#DC2626"
          />
          {/* Bottom half - white */}
          <path
            d="M20 20C20 20 0 20 0 20C0 31.046 8.954 40 20 40C31.046 40 40 31.046 40 20C40 20 20 20 20 20Z"
            fill="white"
          />
          {/* Horizontal divider line */}
          <line x1="0" y1="20" x2="40" y2="20" stroke="#1F1F1F" strokeWidth="2.5" />
          {/* Center circle - white with border */}
          <circle cx="20" cy="20" r="6" fill="white" stroke="#1F1F1F" strokeWidth="2" />
          {/* Inner circle - black */}
          <circle cx="20" cy="20" r="3.5" fill="#1F1F1F" />
          {/* Highlight on top half */}
          <ellipse cx="20" cy="10" rx="12" ry="6" fill="white" opacity="0.2" />
        </svg>
      </div>
      
      {/* Text Logo with retro game styling */}
      <span className={`${textSize} font-black text-primary-red leading-tight tracking-tight drop-shadow-sm`}>
        POKEBIN
      </span>
    </div>
  )
}

export default Logo


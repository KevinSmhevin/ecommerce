import { Link } from 'react-router-dom'

/**
 * Banner Component
 * 
 * A reusable hero banner component for featured content.
 * 
 * @param {string} image - Path to the banner image
 * @param {string} title - Main heading text (optional)
 * @param {string} subtitle - Subheading text (optional)
 * @param {string} buttonText - Text for the call-to-action button
 * @param {string} buttonLink - URL for the button link
 * @param {string} height - Height class (default: 'h-[500px]')
 * @param {string} textPosition - Text positioning: 'left', 'center', 'right' (default: 'center')
 * @param {string} overlay - Overlay opacity: 'light', 'medium', 'dark', 'none' (default: 'medium')
 */
const Banner = ({
  image,
  title,
  subtitle,
  buttonText,
  buttonLink,
  height = 'h-[500px]',
  textPosition = 'center',
  overlay = 'medium'
}) => {
  const overlayClasses = {
    none: '',
    light: 'bg-black/20',
    medium: 'bg-black/40',
    dark: 'bg-black/60'
  }

  const textAlignClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right'
  }

  return (
    <div className={`relative ${height} w-full overflow-hidden rounded-lg border-2 border-gray-200 shadow-lg`}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${image})`,
          backgroundPosition: 'center'
        }}
      />
      
      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      )}
      
      {/* Content */}
      <div className={`relative h-full flex flex-col justify-center ${textAlignClasses[textPosition]} px-8 md:px-16 lg:px-24`}>
        {title && (
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p className="text-xl md:text-2xl text-white mb-8 drop-shadow-lg max-w-2xl">
            {subtitle}
          </p>
        )}
        
        {buttonText && buttonLink && (
          buttonLink.startsWith('#') ? (
            <a
              href={buttonLink}
              onClick={(e) => {
                e.preventDefault()
                const element = document.querySelector(buttonLink)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="inline-block px-8 py-4 bg-primary-red text-white font-bold text-lg rounded-lg hover:bg-red-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer"
            >
              {buttonText}
            </a>
          ) : (
            <Link
              to={buttonLink}
              className="inline-block px-8 py-4 bg-primary-red text-white font-bold text-lg rounded-lg hover:bg-red-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {buttonText}
            </Link>
          )
        )}
      </div>
    </div>
  )
}

export default Banner

import { CiInstagram } from 'react-icons/ci'

const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/poke_bin/'

const InstagramLink = ({ className = '' }) => {
  return (
    <a
      href={INSTAGRAM_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Visit poke_bin on Instagram"
      className={`inline-flex items-center text-primary-red hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-red focus:ring-offset-2 rounded ${className}`}
    >
      <CiInstagram className="w-8 h-8" aria-hidden="true" />
    </a>
  )
}

export default InstagramLink

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Banner {
  title: string
  image: string
  link: string
}

const BANNERS: readonly Banner[] = [
  { title: 'Graded Pokemon English',  image: '/banners/mini/graded-pokemon-english.png',  link: '/category/graded-pokemon-english' },
  { title: 'Graded Pokemon Japanese', image: '/banners/mini/graded-pokemon-japanese.png', link: '/category/graded-pokemon-japanese' },
  { title: 'Graded One Piece',        image: '/banners/mini/graded-one-piece.png',         link: '/category/graded-one-piece' },
]

const MiniBanners = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {BANNERS.map((b) => (
        <Link
          key={b.title}
          to={b.link}
          className="group glass glass-hover relative h-44 overflow-hidden rounded-2xl hover:-translate-y-1 hover:!border-red-500/50"
        >
          <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover opacity-80 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative h-full flex flex-col items-start justify-end p-5">
            <h3 className="text-white text-sm font-black uppercase tracking-wider drop-shadow">{b.title}</h3>
            <span className="flex items-center gap-1 text-white/70 group-hover:text-red-400 text-xs font-bold uppercase tracking-widest mt-1 transition-colors">
              Browse <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
)

export default MiniBanners

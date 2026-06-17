import type { ReactNode } from 'react'

interface AlertProps {
  type?: 'error' | 'success'
  children: ReactNode
}

const Alert = ({ type = 'error', children }: AlertProps) => {
  const cls = type === 'success'
    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
    : 'bg-red-500/10 border-red-400/30 text-red-300'
  return (
    <div className={`backdrop-blur-md border rounded-xl px-4 py-3 text-sm font-bold ${cls}`}>
      {children}
    </div>
  )
}

export default Alert

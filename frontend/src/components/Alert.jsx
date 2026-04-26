const Alert = ({ type = 'error', children }) => {
  const cls = type === 'success'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`border-2 rounded-xl px-4 py-3 text-sm font-bold ${cls}`}>
      {children}
    </div>
  )
}

export default Alert

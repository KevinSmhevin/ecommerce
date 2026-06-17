import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string | string[] | null
}

const FormField = ({ id, label, error, ...props }: FormFieldProps) => {
  const errorMessage = Array.isArray(error) ? error[0] : error
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-black uppercase tracking-wider text-white/80 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-red-500 focus:bg-white/[0.07] transition-colors"
        {...props}
      />
      {errorMessage && <p className="mt-1 text-xs text-red-400 font-bold">{errorMessage}</p>}
    </div>
  )
}

export default FormField

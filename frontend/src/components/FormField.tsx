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
      <label htmlFor={id} className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full px-3 py-2.5 bg-white border-2 border-black/20 rounded-lg text-black text-sm placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
        {...props}
      />
      {errorMessage && <p className="mt-1 text-xs text-red-600 font-bold">{errorMessage}</p>}
    </div>
  )
}

export default FormField

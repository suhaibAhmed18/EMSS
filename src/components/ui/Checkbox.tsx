'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  className?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => {
    const checkboxClasses = `
      h-4 w-4 rounded border-white/20 bg-white/[0.05]
      checked:bg-[color:var(--accent-hi)] checked:border-[color:var(--accent-hi)]
      hover:border-white/30 hover:bg-white/[0.08]
      focus:ring-2 focus:ring-[color:var(--accent-hi)]/40 focus:ring-offset-0 focus:border-[color:var(--accent-hi)]
      transition-all duration-200
      cursor-pointer
      disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/20 disabled:hover:bg-white/[0.05]
    `.trim().replace(/\s+/g, ' ')

    if (label) {
      return (
        <label className={`flex items-center gap-2 cursor-pointer group ${className}`}>
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            {...props}
          />
          <span className="text-sm text-white/70 group-hover:text-white transition-colors select-none">
            {label}
          </span>
        </label>
      )
    }

    return (
      <input
        ref={ref}
        type="checkbox"
        className={`${checkboxClasses} ${className}`}
        {...props}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox

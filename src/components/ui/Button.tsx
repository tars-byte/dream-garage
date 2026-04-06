import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  children: ReactNode
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'text-white active:scale-[0.98] font-semibold',
  secondary:
    'bg-surface-elevated text-text hover:bg-surface-hover border border-border font-medium',
  ghost:
    'bg-transparent text-text-secondary hover:text-text hover:bg-surface-elevated border border-border font-medium',
  danger:
    'bg-transparent text-budget-red hover:bg-budget-red/10 border border-budget-red/40 font-medium',
}

const variantStyle: Record<NonNullable<ButtonProps['variant']>, CSSProperties | undefined> = {
  primary: {
    background: 'linear-gradient(135deg, #e31e26, #c01b21)',
    boxShadow: '0 2px 12px rgba(227,30,38,0.3)',
  },
  secondary: undefined,
  ghost: undefined,
  danger: undefined,
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={!disabled ? variantStyle[variant] : undefined}
      className={[
        'inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}

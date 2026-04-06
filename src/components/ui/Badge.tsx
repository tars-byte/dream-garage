import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'expo' | 'electric' | 'hybrid' | 'fourwd' | 'featured' | 'popular'
  children: ReactNode
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-surface-elevated text-text-secondary border border-border',
  expo: 'bg-accent text-white font-semibold',
  electric: 'bg-electric/15 text-electric border border-electric/30',
  hybrid: 'bg-hybrid/15 text-hybrid border border-hybrid/30',
  fourwd: 'bg-surface-elevated text-text-secondary border border-border',
  featured: 'bg-budget-yellow/15 text-budget-yellow border border-budget-yellow/30',
  popular: 'bg-accent-muted text-accent border border-accent/30',
}

export default function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

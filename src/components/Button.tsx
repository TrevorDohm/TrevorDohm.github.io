import { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

type ButtonOrAnchorProps = {
  variant?: 'primary' | 'secondary'
  as?: 'a' | 'button'
  href?: string
  target?: string
  rel?: string
}

type MotionButtonProps = HTMLMotionProps<'button'> & ButtonOrAnchorProps & {
  as?: 'button'
}

type MotionAnchorProps = HTMLMotionProps<'a'> & ButtonOrAnchorProps & {
  as: 'a'
}

type ButtonProps = MotionButtonProps | MotionAnchorProps

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className = '', variant = 'primary', as = 'button', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
    
    const variants = {
      primary: "bg-foreground text-background hover:bg-accent-dark focus:ring-foreground",
      secondary: "bg-accent-light text-foreground hover:bg-accent/10 focus:ring-accent"
    }
    
    if (as === 'a') {
      return (
        <motion.a
          ref={ref as any}
          className={`${baseStyles} ${variants[variant]} ${className}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...(props as MotionAnchorProps)}
        />
      )
    }

    return (
      <motion.button
        ref={ref as any}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...(props as MotionButtonProps)}
      />
    )
  }
)

Button.displayName = 'Button'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useCallback, useMemo } from 'react'

interface AnimatedTextProps {
  text: string
  className?: string
  once?: boolean
}

export const AnimatedText = ({ text, className = "", once = true }: AnimatedTextProps) => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: once })
  
  const createAnimationVariants = useCallback(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
      },
    }),
  }), [])

  const words = useMemo(() => text.split(" "), [text])
  
  const variants = useMemo(() => createAnimationVariants(), [createAnimationVariants])

  return (
    <motion.div 
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          className="inline-block mr-[0.4em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
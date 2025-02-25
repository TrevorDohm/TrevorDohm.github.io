import { AnimatedText } from './AnimatedText'
import { Button } from './Button'
import { motion } from 'framer-motion'
import { useCallback } from 'react'

export const Hero = () => {
  const handleContactClick = useCallback(() => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden"
          >
            <img
              src="pfp.jpg"
              alt="Trevor Dohm"
              className="w-full h-full object-cover object-center object-top"
              style={{ objectPosition: 'center 20%' }}
            />
          </motion.div>
          <AnimatedText
            text="Trevor Dohm"
            className="heading-xl mb-4"
          />
          <AnimatedText
            text="Triple Major in Computer Science, Mathematics, and Data Science"
            className="body-lg mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted mb-8"
          >
            Located in Dallas, TX
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4 justify-center"
          >
            <Button onClick={handleContactClick}>
              Get in touch
            </Button>
            <Button 
              variant="secondary"
              as="a"
              href="https://www.linkedin.com/in/trevordohm/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View LinkedIn
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
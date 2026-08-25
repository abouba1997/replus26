'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { motion } from 'motion/react'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export function SiteMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLElement>(null)
  useGSAP(
    () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) return
      const ctx = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
        intro
          .from('.nav', { yPercent: -100, duration: 0.8 })
          .from('.hero-content > *', { y: 28, opacity: 0, stagger: 0.1, duration: 0.75 }, '-=0.35')
          .from('.hero-orbit', { scale: 0.88, opacity: 0, duration: 1.15 }, '-=0.85')
          .from('.orbit-label', { opacity: 0, stagger: 0.16, duration: 0.55 }, '-=0.55')
        gsap.to('.ring-one', { rotate: 360, duration: 36, repeat: -1, ease: 'none' })
        gsap.to('.ring-two', { rotate: -360, duration: 48, repeat: -1, ease: 'none' })
        gsap.to('.ring-three', { rotate: 360, duration: 64, repeat: -1, ease: 'none' })
        gsap.to('.solar-rays', { rotate: 360, duration: 90, repeat: -1, ease: 'none' })
        gsap.to('.sun-disc', {
          scale: 1.03,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
        gsap.to('.hero-orbit', {
          y: -18,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', scrub: true },
        })
        gsap.to('.hero-content', {
          y: 22,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', scrub: true },
        })
        gsap.utils.toArray<HTMLElement>('.event-fact').forEach((el, i) =>
          gsap.fromTo(
            el,
            { y: 24 },
            {
              y: 0,
              delay: i * 0.08,
              duration: 0.7,
              clearProps: 'transform',
              scrollTrigger: {
                trigger: '.event-showcase',
                start: '60% bottom',
                once: true,
              },
            },
          ),
        )
        const onMove = (event: MouseEvent) => {
          const x = (event.clientX / window.innerWidth - 0.5) * 16
          const y = (event.clientY / window.innerHeight - 0.5) * 12
          gsap.to('.solar-corona', { x: x * 0.35, y: y * 0.35, duration: 1.1, overwrite: 'auto', ease: 'power2.out' })
          gsap.to('.orbit-core', { x: x * 0.22, y: y * 0.18, duration: 1.1, overwrite: 'auto', ease: 'power2.out' })
        }
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
      }, scope)
      return () => ctx.revert()
    },
    { scope },
  )
  return <main ref={scope}>{children}</main>
}

export function MotionReveal({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

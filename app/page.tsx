'use client'

import { useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  MapPin,
  Menu,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { ApplySection } from '@/components/application-form'
import { BrandLogo } from '@/components/brand-logo'
import { LanguageSwitcher, LocaleProvider, useLocale } from '@/components/locale-provider'
import { PartnerMarks } from '@/components/partners'
import { MotionReveal, SiteMotion } from '@/components/site-motion'
import { getCopy } from '@/lib/i18n'

function SolarSystem() {
  return (
    <div className="hero-orbit" aria-label="Animated solar energy system" role="img">
      <div className="solar-corona" />
      <div className="solar-rays" />
      <div className="orbit-core">
        <div className="sun-disc">
          <img src="/sun-surface.png" alt="" />
        </div>
      </div>
      <div className="orbit-ring ring-one" />
      <div className="orbit-ellipse ring-two-wrap">
        <span className="orbit-ring ring-two" />
      </div>
      <div className="orbit-ellipse ring-three-wrap">
        <span className="orbit-ring ring-three" />
      </div>
      <span className="orbit-label label-one">
        LAS VEGAS <small>36°N · 115°W</small>
      </span>
      <span className="orbit-label label-two">
        RE+ 2026 <small>16–19 NOV · LVCC</small>
      </span>
      <span className="orbit-satellite satellite-one" />
      <span className="orbit-satellite satellite-two" />
    </div>
  )
}

function Landing() {
  const { locale } = useLocale()
  const c = getCopy(locale)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <SiteMotion>
      <nav className="nav">
        <a className="brand" href="#top">
          <BrandLogo />
        </a>
        <div className="nav-links">
          <a href="#event">{c.navEvent}</a>
          <a href="#mission">{c.navMission}</a>
          <a href="#candidature">{c.navApply}</a>
        </div>
        <div className="nav-right">
          <LanguageSwitcher />
          <a className="nav-cta" href="#candidature">
            {c.navCta} <ArrowRight size={15} />
          </a>
        </div>
        <button
          className="menu-button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {menuOpen && (
        <div className="mobile-menu">
          <a href="#event" onClick={() => setMenuOpen(false)}>
            {c.navEvent}
          </a>
          <a href="#mission" onClick={() => setMenuOpen(false)}>
            {c.navMission}
          </a>
          <a href="#candidature" onClick={() => setMenuOpen(false)}>
            {c.navApply}
          </a>
        </div>
      )}

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-scanline" />
        <div className="hero-content">
          <div className="eyebrow lime">
            <span className="pulse-dot" /> {c.eyebrow}
          </div>
          <h1>{c.heroTitle}</h1>
          <p className="hero-copy">{c.heroCopy}</p>
          <a className="button primary large" href="#candidature">
            {c.heroCta} <ArrowRight size={18} />
          </a>
          <div className="scroll-cue">
            <ArrowDown size={15} /> {c.scroll}
          </div>
        </div>
        <SolarSystem />
        <div className="hero-bottom">
          <span>{c.organized}</span>
          <span className="line" />
          <span>{c.bridge}</span>
        </div>
      </section>
      <PartnerMarks />

      <MotionReveal>
        <section id="event" className="event-showcase">
          <div className="event-top">
            <div className="event-heading">
              <span className="eyebrow">{c.eventLabel}</span>
              <h2>
                RE+ <em>2026</em>
              </h2>
              <p>{c.eventIntro}</p>
            </div>
            <div className="event-visual">
              <div className="event-sun">
                <img src="/brand/replus-mali-icon.png" alt="" />
              </div>
              <div className="event-track">
                <span />
                <span />
                <span />
              </div>
              <span className="event-location">Las Vegas Convention Center</span>
            </div>
          </div>
          <div className="event-facts">
            <div className="event-fact">
              <CalendarDays />
              <span>
                <b>{c.dateLabel}</b> {c.date}
              </span>
            </div>
            <div className="event-fact">
              <MapPin />
              <span>
                <b>Las Vegas</b> {c.location}
              </span>
            </div>
            <div className="event-fact">
              <Users />
              <span>
                <b>{c.professionals}</b> RE+
              </span>
            </div>
          </div>
        </section>
      </MotionReveal>

      <MotionReveal>
        <section id="mission" className="mission">
          <div className="section-intro">
            <span className="eyebrow">{c.why}</span>
            <h2>{c.missionTitle}</h2>
          </div>
          <div className="mission-body">
            <p>{c.missionBody}</p>
            <div className="benefits">
              {c.benefits.map((item, index) => (
                <div className="benefit" key={item}>
                  <span>0{index + 1}</span>
                  <Check size={16} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </MotionReveal>

      <MotionReveal>
        <section className="statement">
          <div className="statement-inner">
            <div className="statement-mark">
              <Zap size={22} />
            </div>
            <p>{c.statement}</p>
            <span className="statement-note">{c.ambition}</span>
          </div>
        </section>
      </MotionReveal>

      <ApplySection />
      <section className="partners-footer">
        <span className="eyebrow">{c.partners}</span>
        <PartnerMarks />
      </section>

      <MotionReveal>
        <section className="closing">
          <div>
            <span className="eyebrow lime">{c.closingEyebrow}</span>
            <h2>{c.closing}</h2>
          </div>
          <a className="button light" href="#candidature">
            {c.apply} <ArrowRight size={17} />
          </a>
        </section>
      </MotionReveal>

      <footer>
        <a className="brand" href="#top">
          <BrandLogo />
        </a>
        <p>{c.footer}</p>
        <a href="mailto:replusevent@amchammali.org">replusevent@amchammali.org</a>
      </footer>
    </SiteMotion>
  )
}

export default function Page() {
  return (
    <LocaleProvider>
      <Landing />
    </LocaleProvider>
  )
}

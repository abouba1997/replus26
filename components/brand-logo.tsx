export function ReplusMark({ title }: { title?: string }) {
  const longRays = [0, 45, 90, 135, 180, 225, 270, 315]
  const shortRays = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden={!title} role={title ? 'img' : undefined}>
      {title ? <title>{title}</title> : null}
      <circle cx="100" cy="100" r="100" fill="#071523" />
      <circle cx="100" cy="100" r="78" stroke="#C8F04A" strokeWidth="3" />
      <g transform="translate(100 100)">
        {longRays.map((deg) => (
          <polygon
            key={`l${deg}`}
            points="0,-76 5.4,-38 -5.4,-38"
            fill="#C8F04A"
            transform={`rotate(${deg})`}
          />
        ))}
        {shortRays.map((deg) => (
          <polygon
            key={`s${deg}`}
            points="0,-58 7.2,-36 -7.2,-36"
            fill="#E8922A"
            transform={`rotate(${deg})`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="32" fill="#F4B942" />
      <rect x="90" y="74" width="20" height="52" rx="4" fill="#fff" />
      <rect x="74" y="90" width="52" height="20" rx="4" fill="#fff" />
      <circle cx="154" cy="58" r="5.5" fill="#C8F04A" />
    </svg>
  )
}

export function BrandLogo() {
  return (
    <>
      <span className="brand-mark">
        <img src="/brand/replus-mali-icon.png" alt="" />
      </span>
      <span className="brand-word">
        <span className="brand-re">
          RE<span>+</span>
        </span>
        <span className="brand-mali">MALI</span>
      </span>
    </>
  )
}

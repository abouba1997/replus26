export function PartnerMarks() {
  return (
    <div className="partners" aria-label="Organisateurs">
      <a className="partner-mark" href="https://ml.usembassy.gov/" target="_blank" rel="noreferrer">
        <span className="partner-stage">
          <span className="partner-logo partner-logo-seal">
            <img src="/partners/embassy-seal.png" alt="United States Embassy Bamako" />
          </span>
        </span>
        <span className="partner-caption">
          U.S. Embassy
          <small>Bamako</small>
        </span>
      </a>
      <a className="partner-mark" href="https://www.amchammali.org/" target="_blank" rel="noreferrer">
        <span className="partner-stage">
          <span className="partner-logo partner-logo-amcham">
            <img src="/partners/amcham-mali-light.png" alt="AmCham Mali" />
          </span>
        </span>
        <span className="partner-caption">
          AmCham Mali
          <small>Chambre de commerce</small>
        </span>
      </a>
      <a className="partner-mark" href="https://www.re-plus.com/" target="_blank" rel="noreferrer">
        <span className="partner-stage">
          <span className="partner-logo partner-logo-replus">
            <img src="/brand/replus-mali-icon.png" alt="RE+ Mali" />
          </span>
        </span>
        <span className="partner-caption">
          RE+ Mali
          <small>Las Vegas · 2026</small>
        </span>
      </a>
    </div>
  )
}

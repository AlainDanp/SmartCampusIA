import esieaLogo from '../assets/esiea-logo.svg';

export default function Logo({ compact = false, light = false }) {
  return (
    <div className={`school-logo ${light ? 'school-logo-light' : ''} ${compact ? 'school-logo-compact' : ''}`}>
      <img className="school-wordmark" src={esieaLogo} alt="ESIEA" />
      {!compact && <span className="school-service">CAMPUS SERVICES</span>}
    </div>
  );
}

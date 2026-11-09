import { enlaceFacebook, enlaceInstagram } from "../utils/contacto";

function IconoInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function IconoFacebook() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// Botones de Instagram y Facebook del salón. Si no cargó ninguno, no muestra nada.
export default function RedesSociales({ salon, className = "" }) {
  const ig = enlaceInstagram(salon?.instagram);
  const fb = enlaceFacebook(salon?.facebook);
  if (!ig && !fb) return null;

  return (
    <div className={`redes ${className}`.trim()}>
      {ig && (
        <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram del salón">
          <IconoInstagram /> <span>Instagram</span>
        </a>
      )}
      {fb && (
        <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook del salón">
          <IconoFacebook /> <span>Facebook</span>
        </a>
      )}
    </div>
  );
}
import logoLight from '../assets/lambat-logo-light.webp'
import logoDark from '../assets/lambat-logo-dark.webp'

type Props = {
  size?: number
  className?: string
  /** Use on surfaces that are dark in both modes (admin sidebar, dark hero art). */
  onDark?: boolean
  /** Show only the round emblem (for the slim sidebar). */
  emblemOnly?: boolean
}

export default function Logo({ size = 40, className = '', onDark = false, emblemOnly = false }: Props) {
  const wide = { height: size, width: 'auto' as const }
  // the emblem is the left part of the image: crop a square from the left
  const crop = (pos: string, trim = 0) => ({ height: size, width: size, objectFit: 'cover' as const, objectPosition: pos, clipPath: trim ? `inset(0 ${trim}% 0 0)` : undefined })
  const lightStyle = emblemOnly ? crop('0% center') : wide
  const darkStyle = emblemOnly ? crop('5% center', 12) : wide

  if (onDark) {
    return <img src={logoDark} alt="LAMBAT" style={darkStyle} className={className} />
  }

  return (
    <>
      <img src={logoLight} alt="LAMBAT" style={lightStyle} className={`logo-light ${className}`} />
      <img src={logoDark} alt="LAMBAT" style={darkStyle} className={`logo-dark ${className}`} />
    </>
  )
}
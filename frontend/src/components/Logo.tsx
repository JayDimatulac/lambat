import logo from '../assets/lambat-logo.png'

type Props = { size?: number; className?: string }

export default function Logo({ size = 40, className = '' }: Props) {
  return (
    <img
      src={logo}
      alt="LAMBAT"
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  )
}
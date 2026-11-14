import { useState } from 'react'
import FishShape from '../FishShape'
import { fishPhotoUrl } from '../../lib/fishPhoto'
import { TILES } from '../../lib/species'

export default function FishPhoto({ species, className = '', photo = false }: { species: string; className?: string; photo?: boolean }) {
  const [broken, setBroken] = useState(false)
  const key = species.trim().toLowerCase()
  const shape = TILES.find((x) => x.name.toLowerCase() === key || x.english.toLowerCase() === key)?.shape ?? 'scad'

  if (photo && !broken) {
    return <img src={fishPhotoUrl(species)} alt={species} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />
  }
  return (
    <div className={`grid place-items-center overflow-hidden border border-line bg-card text-teal ${className}`} role="img" aria-label={species}>
      <FishShape shape={shape} className="h-auto w-3/5 max-w-40" />
    </div>
  )
}
// Show wherever a risk estimate or price appears.
export default function Disclaimer({ children = 'Estimate only. Not a food-safety test.' }: { children?: string }) {
  return <p className="text-xs italic text-ink-soft">{children}</p>
}

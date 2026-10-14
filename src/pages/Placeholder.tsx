import Disclaimer from '../components/ui/Disclaimer'

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h2 className="text-[28px]">{title}</h2>
      <p className="text-ink-soft">Next screen to build.</p>
      <Disclaimer />
    </div>
  )
}

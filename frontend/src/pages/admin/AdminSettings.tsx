import type { ReactNode } from 'react'
import { Languages, Moon, Palette, Sun } from 'lucide-react'
import LangToggle from '../../components/layout/LangToggle'
import { useSettings } from '../../lib/settings'
import { Panel, Toggle, type LIcon } from './AdminBits'
import { useA } from './adminText'

function Row({ icon: Icon, label, children }: { icon: LIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-seafoam text-teal"><Icon size={20} strokeWidth={1.8} /></span>
        <b className="text-[15px]">{label}</b>
      </span>
      {children}
    </div>
  )
}

export default function AdminSettings() {
  const A = useA()
  const { theme, setTheme } = useSettings()
  const night = theme === 'night'

  return (
    <div className="max-w-2xl space-y-5">
      <Panel icon={Palette} title={A('st.appearance')}>
        <Row icon={night ? Moon : Sun} label={A('st.night')}>
          <Toggle checked={night} onChange={(v) => setTheme(v ? 'night' : 'day')} label={A('st.night')} />
        </Row>
      </Panel>
      <Panel icon={Languages} title={A('st.language')}>
        <Row icon={Languages} label={A('st.language')}>
          <LangToggle />
        </Row>
      </Panel>
    </div>
  )
}
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import LogoutSheet from '../components/auth/LogoutSheet'
import { useT } from '../lib/i18n'

// For roles whose screens are not built yet (organizations)
export default function Soon() {
  const t = useT()
  const [ask, setAsk] = useState(false)
  return (
    <AuthLayout>
      <div className="space-y-5">
        <h1 className="font-numeral text-[30px] font-bold leading-tight">{t('org.soon')}</h1>
        <button type="button" onClick={() => setAsk(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-teal text-lg font-semibold text-teal">
          <LogOut size={22} strokeWidth={1.8} aria-hidden />{t('auth.logout')}
        </button>
      </div>
      <LogoutSheet open={ask} onClose={() => setAsk(false)} />
    </AuthLayout>
  )
}
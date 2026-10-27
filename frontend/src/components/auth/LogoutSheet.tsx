import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Sheet from '../ui/Sheet'
import Button from '../ui/Button'
import { useAuth } from '../../lib/auth'
import { useT } from '../../lib/i18n'

// One question before signing out, so a slip of the thumb does not log anyone out.
export default function LogoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <Sheet open={open} onClose={onClose} title={t('auth.logout.q')}>
      <p className="text-lg">{t('auth.logout.text')}</p>
      <div className="space-y-3">
        <Button className="min-h-14 w-full gap-2 text-base" onClick={() => { logout(); onClose(); navigate('/', { replace: true }) }}>
          <LogOut size={20} strokeWidth={1.8} aria-hidden />
          {t('auth.logout.yes')}
        </Button>
        <Button variant="secondary" className="min-h-14 w-full" onClick={onClose}>{t('outcome.notyet')}</Button>
      </div>
    </Sheet>
  )
}
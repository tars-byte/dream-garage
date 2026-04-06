import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useGarageStore,
  selectTotalPrice,
  selectBudgetPct,
  selectFilledCars,
} from '../store/garageStore'
import ShareCard from '../components/share/ShareCard'
import { encodeGarage, buildShareUrl, buildWhatsAppUrl } from '../lib/garageUrl'
import { saveGarage } from '../lib/garageApi'
import { formatPrice } from '../lib/utils'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ShareButtonProps {
  icon: string
  label: string
  onClick: () => void
  primary?: boolean
}

function ShareButton({ icon, label, onClick, primary }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all duration-150 active:scale-95',
        primary
          ? 'bg-accent border-accent text-white'
          : 'bg-surface-elevated border-border text-text-secondary hover:text-text hover:border-accent/30',
      ].join(' ')}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  )
}

export default function SharePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const cars = useGarageStore((s) => s.cars)
  const label = useGarageStore((s) => s.label)
  const tagline = useGarageStore((s) => s.tagline)
  const sessionId = useGarageStore((s) => s.sessionId)

  const filledCars = selectFilledCars(cars)
  const total = selectTotalPrice(cars)
  const pct = selectBudgetPct(cars)

  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Try to save on mount to get a short URL
  useEffect(() => {
    if (filledCars.length === 0) return
    setSaveState('saving')
    saveGarage({ cars, label, tagline, sessionId })
      .then((result) => {
        if (result) {
          setSavedId(result.id)
          setSaveState('saved')
        } else {
          setSaveState('error')
        }
      })
      .catch(() => setSaveState('error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redirect back if garage is empty
  useEffect(() => {
    if (filledCars.length === 0) navigate('/', { replace: true })
  }, [filledCars.length, navigate])

  // Build the share URL (short if available, long URL as fallback)
  const shareUrl = savedId
    ? buildShareUrl(savedId)
    : `${window.location.origin}/?g=${encodeGarage(cars, label, tagline)}`

  const challengeUrl = savedId
    ? buildShareUrl(savedId, true)
    : shareUrl + '?challenge=1'

  const carListText = filledCars
    .map((c) => `🚗 ${c.brand} ${c.model} — ${formatPrice(c.price_usd)}`)
    .join('\n')

  function handleWhatsApp() {
    const msg = t('share.whatsapp_message', {
      total: formatPrice(total),
      url: shareUrl,
    })
    window.open(buildWhatsAppUrl(msg), '_blank')
  }

  function handleChallenge() {
    const msg = t('share.whatsapp_challenge_message', {
      cars: carListText,
      total: formatPrice(total),
      url: challengeUrl,
    })
    window.open(buildWhatsAppUrl(msg), '_blank')
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // Safari fallback
      const el = document.createElement('textarea')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleInstagram() {
    // Open vertical story card for Instagram/TikTok
    if (savedId) {
      window.open(`/api/og/${savedId}-story.png`, '_blank')
    }
  }

  function handleDownloadStory() {
    if (!savedId) return
    const a = document.createElement('a')
    a.href = `/api/og/${savedId}-story.png`
    a.download = `dream-garage-story-${savedId}.png`
    a.click()
  }

  const displayLabel = label || t('garage.default_label')

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0d0d0d]/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/garage')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-elevated text-text-secondary hover:text-text transition-colors"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-text flex-1">{t('share.title')}</h1>
      </header>

      <main className="flex-1 px-4 py-5 flex flex-col gap-6 pb-8">

        {/* Share card preview */}
        <section>
          <ShareCard
            cars={cars}
            label={displayLabel}
            tagline={tagline}
            totalPrice={total}
            budgetPct={pct}
          />
        </section>

        {/* Share URL */}
        <section className="flex items-center gap-2 bg-surface-elevated border border-border rounded-2xl px-3 py-2.5">
          <span className="text-xs text-text-secondary flex-1 truncate font-mono">
            {saveState === 'saving' ? t('common.loading') : shareUrl}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            {copied ? t('share.copied') : t('share.copy_link')}
          </button>
        </section>

        {/* Share buttons */}
        <section>
          <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">
            {t('share.share_to')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <ShareButton icon="💬" label={t('share.whatsapp')} onClick={handleWhatsApp} primary />
            <ShareButton icon="📸" label={t('share.instagram')} onClick={handleInstagram} />
            <ShareButton icon="🎵" label="TikTok Story" onClick={handleInstagram} />
            <ShareButton icon="📋" label={copied ? '✓' : t('share.copy_link')} onClick={handleCopy} />
          </div>
          {savedId && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <ShareButton
                icon="⬇️"
                label="Story 9:16"
                onClick={handleDownloadStory}
              />
              <ShareButton
                icon="🖼️"
                label={t('share.download_image')}
                onClick={() => window.open(`/api/og/${savedId}.png`, '_blank')}
              />
            </div>
          )}
        </section>

        {/* Challenge section */}
        <section className="bg-surface rounded-2xl p-4 border border-border flex flex-col gap-3">
          <div>
            <p className="font-semibold text-text text-sm">{t('share.challenge_section')}</p>
            <p className="text-xs text-text-secondary mt-1">{t('share.challenge_description')}</p>
          </div>
          <button
            onClick={handleChallenge}
            className="w-full py-3 rounded-xl bg-surface-elevated border border-border text-sm font-semibold text-text hover:border-accent/50 hover:text-accent transition-all active:scale-[0.98]"
          >
            🔥 {t('share.challenge_whatsapp')}
          </button>
        </section>

        {/* Leaderboard link */}
        <section className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-secondary">{t('share.votes_zero')}</p>
          <button
            onClick={() => navigate('/leaderboard')}
            className="text-sm font-semibold text-accent hover:underline"
          >
            {t('share.view_leaderboard')} →
          </button>
        </section>
      </main>
    </div>
  )
}

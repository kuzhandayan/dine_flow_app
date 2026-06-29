'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'

interface GSTConfig {
  gstEnabled: boolean
  defaultGSTRate: number
  isGSTRegistered: boolean
  gstin: string | null
  gstBusinessName: string | null
  gstAddress: string | null
}

const DEFAULT: GSTConfig = {
  gstEnabled: true,
  defaultGSTRate: 5,
  isGSTRegistered: false,
  gstin: '',
  gstBusinessName: '',
  gstAddress: '',
}

export default function GSTConfigPage(): React.JSX.Element {
  const [config, setConfig] = useState<GSTConfig>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/settings/gst')
        const data = (await res.json()) as { config: GSTConfig | null }
        if (data.config) {
          setConfig({
            ...data.config,
            gstin: data.config.gstin ?? '',
            gstBusinessName: data.config.gstBusinessName ?? '',
            gstAddress: data.config.gstAddress ?? '',
          })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function toggle(field: keyof GSTConfig): void {
    setConfig((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  async function save(): Promise<void> {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/settings/gst', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          gstin: config.gstin || null,
          gstBusinessName: config.gstBusinessName || null,
          gstAddress: config.gstAddress || null,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to save'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="GST Configuration" subtitle="Configure tax settings for your restaurant" />
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" /></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="GST Configuration" subtitle="Configure tax settings for your restaurant" />

      <div className="max-w-xl space-y-4">

        {/* Master GST toggle */}
        <div className={`border rounded-2xl p-5 transition-colors ${config.gstEnabled ? 'bg-[rgb(var(--df-card))] border-[rgb(var(--df-border))]' : 'bg-[rgb(var(--df-surface-2))] border-[rgb(var(--df-border))]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold">Apply GST on Orders</p>
              <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5">
                {config.gstEnabled
                  ? 'GST is calculated and shown on all bills'
                  : 'GST is disabled — no tax applied to any order'}
              </p>
            </div>
            <button
              onClick={() => toggle('gstEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.gstEnabled ? 'bg-[rgb(var(--df-accent))]' : 'bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.gstEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {config.gstEnabled && (
          <>
            {/* Default GST rate */}
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
              <p className="text-[12px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Default Rate</p>
              <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                Default GST Rate (%)
              </label>
              <select
                value={config.defaultGSTRate}
                onChange={(e) => setConfig({ ...config, defaultGSTRate: Number(e.target.value) })}
                className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]"
              >
                <option value={0}>0% — Exempt</option>
                <option value={5}>5% — Standard (2.5% CGST + 2.5% SGST)</option>
                <option value={12}>12% (6% CGST + 6% SGST)</option>
                <option value={18}>18% (9% CGST + 9% SGST)</option>
                <option value={28}>28% (14% CGST + 14% SGST)</option>
              </select>
              <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-1.5">
                Applied to new menu items. Can be overridden per item in Menu settings.
              </p>
            </div>

            {/* GST Registration */}
            <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-5">
              <p className="text-[12px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">GSTIN Details</p>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-medium">GST Registered Business</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-2))] mt-0.5">Print GSTIN on tax invoices</p>
                </div>
                <button
                  onClick={() => toggle('isGSTRegistered')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.isGSTRegistered ? 'bg-[rgb(var(--df-accent))]' : 'bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.isGSTRegistered ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {config.isGSTRegistered && (
                <div className="space-y-3 pt-3 border-t border-[rgb(var(--df-border))]">
                  <div>
                    <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">GSTIN</label>
                    <input
                      value={config.gstin ?? ''}
                      onChange={(e) => setConfig({ ...config, gstin: e.target.value.toUpperCase() })}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] font-mono tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">Registered Business Name</label>
                    <input
                      value={config.gstBusinessName ?? ''}
                      onChange={(e) => setConfig({ ...config, gstBusinessName: e.target.value })}
                      placeholder="As per GST certificate"
                      className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">Registered Address</label>
                    <textarea
                      value={config.gstAddress ?? ''}
                      onChange={(e) => setConfig({ ...config, gstAddress: e.target.value })}
                      placeholder="Full address as per GST registration"
                      rows={2}
                      className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <p className="text-[13px] text-red-400 bg-red-400/10 px-4 py-2.5 rounded-xl border border-red-400/20">{error}</p>
        )}

        <button
          onClick={() => void save()}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

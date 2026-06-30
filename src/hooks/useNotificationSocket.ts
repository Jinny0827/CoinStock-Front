import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'

export function useNotificationSocket() {
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()

  useEffect(() => {
    const apiBase = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    const wsBase = apiBase
      ? apiBase.replace(/^http/, 'ws')
      : (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + window.location.host

    const url = token ? `${wsBase}/ws?token=${encodeURIComponent(token)}` : `${wsBase}/ws`
    const ws = new WebSocket(url)

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { type: string; title?: string; body?: string; symbol?: string }
        if (msg.type === 'notification') {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          window.dispatchEvent(new CustomEvent('jigeum:notification', { detail: msg }))
        }
      } catch { /* QUOTE_UPDATE 등 JSON 파싱 불필요한 메시지는 무시 */ }
    }

    ws.onerror = () => {}
    ws.onclose = () => {}

    return () => { ws.close() }
  }, [token, queryClient])
}

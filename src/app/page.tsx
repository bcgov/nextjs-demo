'use client'

import { useEffect, useState } from 'react'

type Diagnostic = {
  clientIp: string
  realIp?: string
  forwardedFor?: string
  userAgent: string
  method: string
  protocol: string
  podHostname: string
  podInternalIps: string[]
  requestHeaders: Record<string, string>
  online: boolean
  downlink?: number
  effectiveType?: string
  rtt?: number
  platform: string
  cores?: number
  memory?: number
}

export default function Home() {
  const [diag, setDiag] = useState<Diagnostic | null>(null)

  useEffect(() => {
    const fetchDiagnostics = async () => {
      const res = await fetch('/api/ip')
      if (!res.ok) {
        console.error('Failed to fetch diagnostics')
        return
      }

      const serverData = await res.json()

      type NetworkInformation = {
        downlink?: number
        effectiveType?: string
        rtt?: number
      }
      const connection: NetworkInformation = (navigator as Navigator & { connection?: NetworkInformation }).connection || {}
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || null

      setDiag({
        ...serverData,
        online: navigator.onLine,
        downlink: connection.downlink,
        effectiveType: connection.effectiveType,
        rtt: connection.rtt,
        platform: navigator.platform,
        cores: navigator.hardwareConcurrency,
        memory,
      })
    }

    fetchDiagnostics()

    const handleOnline = () => setDiag(d => d ? { ...d, online: true } : null)
    const handleOffline = () => setDiag(d => d ? { ...d, online: false } : null)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!diag) return <p>Loading diagnostics...</p>

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>System + Network Diagnostics</h1>
      <ul>
        <li><strong>Client IP:</strong> {diag.clientIp}</li>
        <li><strong>Real IP:</strong> {diag.realIp || 'N/A'}</li>
        <li><strong>Forwarded For:</strong> {diag.forwardedFor || 'N/A'}</li>
        <li><strong>HTTP Method:</strong> {diag.method}</li>
        <li><strong>Protocol:</strong> {diag.protocol}</li>
        <li><strong>Pod Hostname:</strong> {diag.podHostname}</li>
        <li><strong>Pod Internal IPs:</strong> {Array.isArray(diag.podInternalIps) ? diag.podInternalIps.join(', ') : 'N/A'}</li>
        <li><strong>Request Headers:</strong>
          <pre>{JSON.stringify(diag.requestHeaders, null, 2)}</pre>
        </li>
        <li><strong>Online:</strong> {diag.online ? '✅ Online' : '❌ Offline'}</li>
        <li><strong>Network Type:</strong> {diag.effectiveType || 'Unknown'}</li>
        <li><strong>Downlink:</strong> {diag.downlink ? `${diag.downlink} Mbps` : 'N/A'}</li>
        <li><strong>RTT:</strong> {diag.rtt ? `${diag.rtt} ms` : 'N/A'}</li>
        <li><strong>User Agent (browser):</strong> {diag.userAgent}</li>
        <li><strong>Platform:</strong> {diag.platform}</li>
        <li><strong>CPU Cores:</strong> {diag.cores || 'N/A'}</li>
        <li><strong>Estimated Memory:</strong> {diag.memory ? `${diag.memory} GB` : 'N/A'}</li>
      </ul>
    </div>
  )
}

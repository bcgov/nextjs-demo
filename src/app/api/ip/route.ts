import { NextRequest } from 'next/server'
import os from 'os'

export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const userAgent = req.headers.get('user-agent')
    const ip =
      forwarded?.split(',')[0]?.trim() ??
      realIp ??
      'Unknown'

    // Pod diagnostics
    const hostname = os.hostname()
    const interfaces = os.networkInterfaces()
    const internalIps: string[] = []

    for (const name in interfaces) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          internalIps.push(net.address)
        }
      }
    }

    const data = {
      clientIp: ip,
      realIp,
      forwardedFor: forwarded,
      userAgent,
      method: req.method,
      protocol: req.nextUrl.protocol,
      podHostname: hostname,
      podInternalIps: internalIps,
      requestHeaders: Object.fromEntries(req.headers.entries()),
    }

    return new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('IP Route Error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to get network info' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

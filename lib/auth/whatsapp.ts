import { normalizePhone } from '@/lib/utils/phone'

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
const WHATSAPP_TEMPLATE_NAME =
  process.env.WHATSAPP_TEMPLATE_NAME || 'authentication_code'
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

export async function sendOTPViaWhatsApp(
  phoneNumber: string,
  code: string
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========================================')
    console.log(`💬 WhatsApp OTP for ${phoneNumber}: ${code}`)
    console.log('========================================\n')
  }

  if (
    !WHATSAPP_ACCESS_TOKEN ||
    !WHATSAPP_PHONE_NUMBER_ID ||
    !WHATSAPP_BUSINESS_ACCOUNT_ID
  ) {
    console.warn('WhatsApp service not configured, skipping OTP send')
    return
  }

  const normalizedPhone = normalizePhone(phoneNumber)
  const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID

  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: {
              code: 'en',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: code,
                  },
                ],
              },
            ],
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: { message: await response.text() },
      }))
      throw new Error(
        `WhatsApp API error: ${JSON.stringify(errorData.error || errorData)}`
      )
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(data.error)}`)
    }
  } catch (error) {
    console.error('Failed to send WhatsApp OTP:', error)
    throw new Error('Failed to send OTP via WhatsApp. Please try again.')
  }
}


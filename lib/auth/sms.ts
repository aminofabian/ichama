function normalizeSmsApiUrl(url: string): string {
  if (!url) return url
  
  const trimmed = url.trim()
  if (!trimmed) return url
  
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    return `https://${trimmed}`
  }
}

const SMS_API_URL = process.env.SMS_API_URL
  ? normalizeSmsApiUrl(process.env.SMS_API_URL)
  : undefined
const SMS_API_KEY = process.env.SMS_API_KEY
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'MERRY'
const SMS_PARTNER_ID = process.env.SMS_PARTNER_ID

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  // In development, log the SMS for testing
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========================================')
    console.log(`📱 SMS to ${phoneNumber}:`)
    console.log(message)
    console.log('========================================\n')
    return true
  }

  if (!SMS_API_URL || !SMS_API_KEY || !SMS_PARTNER_ID) {
    console.warn('SMS service not configured, skipping SMS send')
    return false
  }

  try {
    // Ensure partnerID is numeric if it's a string
    const partnerID = typeof SMS_PARTNER_ID === 'string' && /^\d+$/.test(SMS_PARTNER_ID)
      ? parseInt(SMS_PARTNER_ID, 10)
      : SMS_PARTNER_ID

    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: SMS_API_KEY,
        partnerID: partnerID,
        mobile: phoneNumber,
        shortcode: SMS_SENDER_ID,
        message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SMS API error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return false
  }
}

export async function sendOTP(
  phoneNumber: string,
  code: string
): Promise<void> {
  const message = `Your Merry verification code is: ${code}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`
  const success = await sendSMS(phoneNumber, message)
  if (!success) {
    throw new Error('Failed to send OTP. Please try again.')
  }
}


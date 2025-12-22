const SMS_API_URL = process.env.SMS_API_URL
const SMS_API_KEY = process.env.SMS_API_KEY
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'MERRY'
const SMS_PARTNER_ID = process.env.SMS_PARTNER_ID

export async function sendOTP(
  phoneNumber: string,
  code: string
): Promise<void> {
  if (!SMS_API_URL || !SMS_API_KEY) {
    console.warn('SMS service not configured, skipping OTP send')
    return
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: `Your Merry verification code is: ${code}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
        senderId: SMS_SENDER_ID,
        partnerId: SMS_PARTNER_ID,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SMS API error: ${error}`)
    }
  } catch (error) {
    console.error('Failed to send OTP:', error)
    throw new Error('Failed to send OTP. Please try again.')
  }
}


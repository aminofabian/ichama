import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'merry_session'
const MAX_AGE = 30 * 24 * 60 * 60

export function setSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return response
}

export function getSessionCookie(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value || null
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME)
  return response
}


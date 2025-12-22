import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/queries/users'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('merry_session')?.value
    if (token) {
      const session = await getSession(token)
      if (session) {
        user = await getUserById(session.user_id)
      }
    }
  } catch (error) {
    // User not authenticated, continue without user
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}


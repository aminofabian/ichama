import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/queries/users'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user = null
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('merry_session')?.value
    if (!token) {
      redirect('/signin')
    }

    const session = await getSession(token)
    if (!session) {
      redirect('/signin')
    }

    user = await getUserById(session.user_id)
    if (!user) {
      redirect('/signin')
    }
  } catch (error) {
    redirect('/signin')
  }

  // Extract only plain properties for Client Components
  const userData = user
    ? {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number,
      }
    : null

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <Sidebar user={userData} />
      </div>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  )
}


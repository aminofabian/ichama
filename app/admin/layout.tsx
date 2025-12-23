import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let adminUser = null
  try {
    adminUser = await requireAdmin()
  } catch (error) {
    redirect('/dashboard')
  }

  if (!adminUser) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}


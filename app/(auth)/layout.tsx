import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="hidden border-b bg-background md:block">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              M
            </div>
            <span className="text-xl font-bold">Merry</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 md:items-center md:justify-center md:p-4">
        {children}
      </main>
    </div>
  )
}


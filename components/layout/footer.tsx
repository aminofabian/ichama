import Link from 'next/link'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '/pricing' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg">
                <span className="text-xl font-bold text-white">M</span>
              </div>
              <span className="text-2xl font-bold">Merry</span>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Manage your chama with confidence. Transparent, automated, and
              secure savings for everyone.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-base font-bold uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-base font-bold uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-base font-bold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-base text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-base text-muted-foreground">
            © {new Date().getFullYear()} Merry. All rights reserved.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Built with ❤️ for chamas across Kenya
          </p>
        </div>
      </div>
    </footer>
  )
}


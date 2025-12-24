export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using Zamio (the &quot;Platform&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Zamio is a digital platform designed to facilitate the management of chamas (savings groups) in Kenya. The Platform enables users to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Create and manage chama groups (savings, merry-go-round, or hybrid)</li>
            <li>Track contributions and payouts</li>
            <li>Manage cycles and member activities</li>
            <li>Monitor personal savings and wallet transactions</li>
            <li>Receive notifications and updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">3.1 Registration:</strong> To use the Platform, you must register for an account using a valid Kenyan phone number. You agree to provide accurate, current, and complete information during registration.
            </p>
            <p>
              <strong className="text-foreground">3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p>
              <strong className="text-foreground">3.3 Phone Verification:</strong> Your phone number will be verified through OTP (One-Time Password) sent via SMS or WhatsApp. You must ensure your phone number is accurate and accessible.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Use of the Platform</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">4.1 Permitted Use:</strong> You agree to use the Platform only for lawful purposes and in accordance with these Terms. The Platform is intended for personal use in managing legitimate chama groups.
            </p>
            <p>
              <strong className="text-foreground">4.2 Prohibited Activities:</strong> You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Violate any laws or regulations in Kenya</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Platform or other accounts</li>
              <li>Use automated systems to access the Platform without permission</li>
              <li>Interfere with or disrupt the Platform or servers</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Chama Management</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">5.1 Chama Creation:</strong> Users may create chama groups and invite members. Chama administrators are responsible for managing their groups and members.
            </p>
            <p>
              <strong className="text-foreground">5.2 Member Responsibilities:</strong> Members of a chama are responsible for their contributions and adherence to the rules set by their chama administrators.
            </p>
            <p>
              <strong className="text-foreground">5.3 Disputes:</strong> Zamio is not responsible for disputes between chama members or administrators. Users are encouraged to resolve disputes within their chama groups.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Financial Transactions</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">6.1 Transaction Records:</strong> The Platform records and tracks financial transactions (contributions, payouts, savings) as entered by users. Zamio does not process actual money transfers.
            </p>
            <p>
              <strong className="text-foreground">6.2 Accuracy:</strong> Users are responsible for the accuracy of all financial data entered into the Platform. Zamio is not liable for errors in data entry or discrepancies in actual funds.
            </p>
            <p>
              <strong className="text-foreground">6.3 No Financial Services:</strong> Zamio does not provide banking, payment processing, or other financial services. The Platform is a record-keeping and management tool only.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data and Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your use of the Platform is also governed by our Privacy Policy. By using the Platform, you consent to the collection and use of information as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Platform and its original content, features, and functionality are owned by Zamio and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              To the maximum extent permitted by law, Zamio shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Platform.
            </p>
            <p>
              Zamio is not responsible for the actual funds managed outside the Platform or for disputes arising from chama activities.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Platform will cease immediately.
            </p>
            <p>
              You may terminate your account at any time by contacting us or through your account settings.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="text-muted-foreground">
            Email: aminofab@gmail.com<br />
            Website: https://zamio.co.ke
          </p>
        </section>
      </div>
    </div>
  )
}


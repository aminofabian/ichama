export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground leading-relaxed">
            Zamio (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform located at zamio.co.ke.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Please read this Privacy Policy carefully. By using our Platform, you consent to the data practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">2.1 Information You Provide</h3>
              <p className="mb-2">We collect information that you voluntarily provide when you:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Register for an account (phone number, full name, password)</li>
                <li>Create or join a chama (chama details, member information)</li>
                <li>Record transactions (contribution amounts, payout information)</li>
                <li>Update your profile (contact information, preferences)</li>
                <li>Contact us for support</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">2.2 Automatically Collected Information</h3>
              <p className="mb-2">When you use our Platform, we may automatically collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (device type, operating system, browser type)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>IP address and approximate location</li>
                <li>Log data (access times, error logs)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">2.3 Phone Number Verification</h3>
              <p className="mb-2">
                We use your phone number for authentication and account verification. OTP (One-Time Password) codes are sent via SMS or WhatsApp to verify your identity. These codes are temporary and expire after use.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Provide, maintain, and improve our Platform services</li>
            <li>Authenticate your identity and secure your account</li>
            <li>Process and record your chama transactions</li>
            <li>Send you notifications about your chama activities and account updates</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Monitor and analyze Platform usage and trends</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">4.1 Within Your Chama</h3>
              <p>
                Information you share within a chama (such as your name, contributions, and transaction history) is visible to other members and administrators of that chama group.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">4.2 Service Providers</h3>
              <p>
                We may share your information with third-party service providers who perform services on our behalf, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Cloud hosting and database services</li>
                <li>SMS and WhatsApp messaging services for OTP delivery</li>
                <li>Analytics and monitoring services</li>
              </ul>
              <p className="mt-2">
                These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">4.3 Legal Requirements</h3>
              <p>
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">4.4 Business Transfers</h3>
              <p>
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">4.5 We Do Not Sell Your Data</h3>
              <p>
                We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and password hashing</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication mechanisms</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p>
              When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal, accounting, or regulatory purposes.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-foreground">Access:</strong> You can access and review your personal information through your account settings</li>
              <li><strong className="text-foreground">Correction:</strong> You can update or correct your personal information at any time</li>
              <li><strong className="text-foreground">Deletion:</strong> You can request deletion of your account and personal information</li>
              <li><strong className="text-foreground">Withdrawal:</strong> You can withdraw your consent for certain data processing activities</li>
              <li><strong className="text-foreground">Portability:</strong> You can request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us using the contact information provided at the end of this policy.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use cookies and similar tracking technologies to track activity on our Platform and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our Platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your information may be transferred to and maintained on computers located outside of Kenya. By using our Platform, you consent to the transfer of your information to these facilities. We will ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Compliance with Kenyan Law</h2>
          <p className="text-muted-foreground leading-relaxed">
            This Privacy Policy is designed to comply with applicable Kenyan data protection laws and regulations, including the Data Protection Act, 2019. We are committed to protecting your privacy rights as provided under Kenyan law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="text-muted-foreground">
            <p>
              <strong className="text-foreground">Email:</strong> aminofab@gmail.com<br />
              <strong className="text-foreground">Website:</strong> https://zamio.co.ke
            </p>
            <p className="mt-4">
              We will respond to your inquiry within a reasonable timeframe in accordance with applicable law.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}


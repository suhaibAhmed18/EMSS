import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black">
              Marketing Platform Pro
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-black mb-8">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: February 3, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Marketing Platform Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our email and SMS marketing platform service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Account registration information (name, email address, password)</li>
                <li>Billing information (credit card details, billing address)</li>
                <li>Profile information (company name, website, phone number)</li>
                <li>Customer data you upload (email addresses, phone numbers, names)</li>
                <li>Campaign content (email templates, SMS messages)</li>
                <li>Support communications</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Usage data (features used, campaigns sent, click rates)</li>
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Log data (access times, pages viewed, errors encountered)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">2.3 Information from Third Parties</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Shopify store data (when you connect your store)</li>
                <li>Email delivery service providers</li>
                <li>SMS service providers</li>
                <li>Payment processors</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide and maintain our service</li>
                <li>Process your transactions and manage your account</li>
                <li>Send marketing campaigns on your behalf</li>
                <li>Provide customer support</li>
                <li>Improve our service and develop new features</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
                <li>Send you service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-black mb-3">4.1 Service Providers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We work with third-party service providers to deliver our service, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Email delivery services (for sending your campaigns)</li>
                <li>SMS providers (for sending text messages)</li>
                <li>Cloud hosting providers (for data storage)</li>
                <li>Payment processors (for billing)</li>
                <li>Analytics providers (for service improvement)</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may disclose your information if required by law or in response to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Court orders or legal process</li>
                <li>Government requests</li>
                <li>Law enforcement investigations</li>
                <li>Protection of our rights and property</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">4.3 Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
                <li>Regular backups and disaster recovery plans</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as necessary to provide our service and comply with legal obligations. Specifically:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-4">
                <li>Account data: Until account deletion plus 30 days</li>
                <li>Campaign data: 7 years for compliance purposes</li>
                <li>Billing records: 7 years as required by law</li>
                <li>Support communications: 3 years</li>
                <li>Usage logs: 2 years</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              
              <h3 className="text-xl font-semibold text-black mb-3">7.1 Access and Portability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can access and export your data through your account dashboard or by contacting us.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">7.2 Correction and Updates</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can update your account information at any time through your account settings.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">7.3 Deletion</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can delete your account and associated data by contacting our support team.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">7.4 Marketing Communications</h3>
              <p className="text-gray-700 leading-relaxed">
                You can opt out of marketing emails by clicking the unsubscribe link or updating your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including standard contractual clauses and adequacy decisions where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">10. Cookies and Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Provide personalized content</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@marketingplatform.com<br />
                  <strong>Address:</strong> 123 Business St, Suite 100, City, State 12345<br />
                  <strong>Phone:</strong> +1-555-123-4567<br />
                  <strong>Data Protection Officer:</strong> dpo@marketingplatform.com
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">13. Regional Specific Information</h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">13.1 European Union (GDPR)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you are in the EU, you have additional rights under GDPR, including the right to object to processing and the right to lodge a complaint with a supervisory authority.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">13.2 California (CCPA)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                California residents have the right to know what personal information is collected, the right to delete personal information, and the right to opt-out of the sale of personal information. We do not sell personal information.
              </p>

              <h3 className="text-xl font-semibold text-black mb-3">13.3 Canada (PIPEDA)</h3>
              <p className="text-gray-700 leading-relaxed">
                Canadian residents have rights under PIPEDA, including the right to access personal information and to file complaints with the Privacy Commissioner of Canada.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
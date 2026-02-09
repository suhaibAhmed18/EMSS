import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
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
          <h1 className="text-4xl font-bold text-black mb-8">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: February 3, 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners about how users interact with their sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Marketing Platform Pro uses cookies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze how you use our service</li>
                <li>Improve our website performance</li>
                <li>Provide personalized content and features</li>
                <li>Ensure security and prevent fraud</li>
                <li>Measure the effectiveness of our marketing campaigns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">3. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">3.1 Essential Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold">Cookie Name</th>
                      <th className="text-left py-2 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2">session_token</td>
                      <td className="py-2">Maintains user session</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">csrf_token</td>
                      <td className="py-2">Security protection</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr>
                      <td className="py-2">auth_remember</td>
                      <td className="py-2">Remember login preference</td>
                      <td className="py-2">30 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-black mb-3">3.2 Performance Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies collect information about how visitors use our website, such as which pages are visited most often and if users get error messages.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold">Cookie Name</th>
                      <th className="text-left py-2 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2">_ga</td>
                      <td className="py-2">Google Analytics tracking</td>
                      <td className="py-2">2 years</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">_gid</td>
                      <td className="py-2">Google Analytics tracking</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                    <tr>
                      <td className="py-2">performance_metrics</td>
                      <td className="py-2">Site performance monitoring</td>
                      <td className="py-2">7 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-black mb-3">3.3 Functional Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies allow the website to remember choices you make and provide enhanced, more personal features.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold">Cookie Name</th>
                      <th className="text-left py-2 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2">user_preferences</td>
                      <td className="py-2">Store user settings</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">theme_preference</td>
                      <td className="py-2">Remember theme choice</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2">language_preference</td>
                      <td className="py-2">Remember language choice</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-black mb-3">3.4 Marketing Cookies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                These cookies are used to deliver advertisements more relevant to you and your interests.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold">Cookie Name</th>
                      <th className="text-left py-2 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2">marketing_campaign</td>
                      <td className="py-2">Track campaign effectiveness</td>
                      <td className="py-2">30 days</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2">referral_source</td>
                      <td className="py-2">Track referral sources</td>
                      <td className="py-2">30 days</td>
                    </tr>
                    <tr>
                      <td className="py-2">conversion_tracking</td>
                      <td className="py-2">Measure conversions</td>
                      <td className="py-2">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may also use third-party services that set cookies on your device. These include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                <li><strong>Stripe:</strong> For secure payment processing</li>
                <li><strong>Intercom:</strong> For customer support chat functionality</li>
                <li><strong>Hotjar:</strong> For user experience analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-semibold text-black mb-3">5.1 Browser Settings</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
                <li>View what cookies are stored on your device</li>
                <li>Delete existing cookies</li>
                <li>Block cookies from being set</li>
                <li>Set preferences for specific websites</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mb-3">5.2 Browser-Specific Instructions</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-black mb-2">Google Chrome</h4>
                  <p className="text-gray-700 text-sm">
                    Settings → Privacy and security → Cookies and other site data
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-black mb-2">Mozilla Firefox</h4>
                  <p className="text-gray-700 text-sm">
                    Options → Privacy & Security → Cookies and Site Data
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-black mb-2">Safari</h4>
                  <p className="text-gray-700 text-sm">
                    Preferences → Privacy → Manage Website Data
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-black mb-2">Microsoft Edge</h4>
                  <p className="text-gray-700 text-sm">
                    Settings → Cookies and site permissions → Cookies and site data
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-black mb-3 mt-6">5.3 Opt-Out Links</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can opt out of certain third-party cookies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                <li><a href="http://optout.aboutads.info/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance Opt-out</a></li>
                <li><a href="http://optout.networkadvertising.org/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Network Advertising Initiative Opt-out</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you choose to disable cookies, some features of our website may not function properly:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You may need to log in repeatedly</li>
                <li>Your preferences and settings may not be saved</li>
                <li>Some features may not work as expected</li>
                <li>You may see less relevant content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">7. Updates to This Cookie Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the updated policy on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-black mb-4">8. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@marketingplatform.com<br />
                  <strong>Address:</strong> 123 Business St, Suite 100, City, State 12345<br />
                  <strong>Phone:</strong> +1-555-123-4567
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
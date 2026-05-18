import { useState } from 'react'
import { PageContainer } from '../../../components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '../../../components/common/Card'

const sections = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal data.',
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    description: 'Rules and guidelines for using EduPath services.',
  },
  {
    id: 'data-protection',
    title: 'Data Protection',
    description: 'Your rights under data protection laws.',
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Measures we take to protect your information.',
  },
  {
    id: 'contact',
    title: 'Contact & Complaints',
    description: 'How to reach us with privacy concerns.',
  },
] as const

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState<typeof sections[number]['id']>('privacy')

  return (
    <PageContainer title="Legal Information">
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Legal Information</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
              Your rights and our obligations under data protection and cyber security laws.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <div className="font-semibold text-slate-900 dark:text-white">Sections</div>
            </CardHeader>
            <CardContent className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border border-transparent transition ${
                    activeSection === section.id
                      ? 'bg-teal-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-medium">{section.title}</div>
                  <div className="text-xs opacity-80">{section.description}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-semibold text-slate-900 dark:text-white">
                {sections.find(sec => sec.id === activeSection)?.title}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-300">
                {sections.find(sec => sec.id === activeSection)?.description}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {(() => {
                if (activeSection === 'privacy') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</h3>
                        <p className="mt-2">
                          EduPath ("we", "our", or "us") is committed to protecting your personal information and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your data in compliance with the Kenya Data Protection Act, 2019 (DPA) and international best practices including the General Data Protection Regulation (GDPR).
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">1. Information We Collect</h4>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li><strong>Account Information:</strong> Name, email address, phone number, username, profile picture</li>
                          <li><strong>Academic Data:</strong> KCSE subjects, grades, mean points, exam year, school name</li>
                          <li><strong>Usage Data:</strong> Pages visited, time spent, features used, IP address, device information</li>
                          <li><strong>Communication Data:</strong> Messages sent through EduGuide AI, posts and comments in Hubs</li>
                          <li><strong>Preferences:</strong> Saved courses, universities, recommendations, bookmarks</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">2. Legal Basis for Processing</h4>
                        <p className="mt-2">Under the Kenya DPA, we process your data based on:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li><strong>Consent:</strong> You have given clear consent for us to process your personal data</li>
                          <li><strong>Contractual Necessity:</strong> To provide the services you have requested</li>
                          <li><strong>Legitimate Interests:</strong> To improve our services and prevent fraud</li>
                          <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">3. How We Use Your Information</h4>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>Provide personalized course recommendations through EduGuide AI</li>
                          <li>Check course eligibility based on your academic profile</li>
                          <li>Enable community features in Hubs (posts, comments, discussions)</li>
                          <li>Send you relevant notifications about courses, deadlines, and opportunities</li>
                          <li>Improve our platform through analytics and user feedback</li>
                          <li>Ensure security and prevent unauthorized access</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">4. Data Sharing & Disclosure</h4>
                        <p className="mt-2">We do not sell your personal data. We may share data only with:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li><strong>Service Providers:</strong> Third parties who assist in operating our platform (e.g., cloud hosting, AI services)</li>
                          <li><strong>Educational Institutions:</strong> With your explicit consent, to facilitate applications</li>
                          <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                          <li><strong>Business Transfers:</strong> In the event of a merger or acquisition (with notice)</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">5. Data Retention</h4>
                        <p className="mt-2">
                          We retain your personal data only as long as necessary for the purposes outlined in this policy. Academic data is retained for the duration of your account plus 3 years, unless you request earlier deletion. You may request deletion of your account and associated data at any time.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">6. Cross-Border Data Transfers</h4>
                        <p className="mt-2">
                          Your data may be processed on servers located outside Kenya. We ensure appropriate safeguards are in place to protect your data in accordance with the Kenya DPA requirements for cross-border transfers.
                        </p>
                      </div>
                    </div>
                  )
                }

                if (activeSection === 'terms') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">Last Updated: {new Date().toLocaleDateString()}</h3>
                        <p className="mt-2">
                          By accessing or using EduPath, you agree to be bound by these Terms & Conditions. If you disagree with any part of these terms, you must not access our service.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">1. Acceptance of Terms</h4>
                        <p className="mt-2">
                          By creating an account and using EduPath, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">2. Eligibility</h4>
                        <p className="mt-2">
                          You must be at least 13 years old to use EduPath. By using our service, you represent that you meet this age requirement. If you are under 18, you must have parental or guardian consent to use our services.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">3. User Responsibilities</h4>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>Provide accurate and complete information when creating your account</li>
                          <li>Maintain the security of your password and account</li>
                          <li>Not share your account credentials with others</li>
                          <li>Not use EduPath for any illegal or unauthorized purpose</li>
                          <li>Respect other users in community features (no harassment, hate speech, or spam)</li>
                          <li>Not attempt to reverse-engineer or hack our systems</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">4. Intellectual Property</h4>
                        <p className="mt-2">
                          All content on EduPath, including text, graphics, logos, and software, is owned by EduPath or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, modify, or distribute our content without prior written consent.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">5. User-Generated Content</h4>
                        <p className="mt-2">
                          You retain ownership of content you post on EduPath (posts, comments, messages). By posting content, you grant EduPath a non-exclusive, worldwide license to use, display, and distribute such content for the purpose of operating our platform. You are responsible for the content you post.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">6. Disclaimer of Warranties</h4>
                        <p className="mt-2">
                          EduPath is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, timely, secure, or error-free. Course recommendations and eligibility information are for guidance only and do not guarantee admission.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">7. Limitation of Liability</h4>
                        <p className="mt-2">
                          To the fullest extent permitted by law, EduPath shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our service, including but not limited to loss of data, loss of opportunities, or academic decisions made based on our recommendations.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">8. Termination</h4>
                        <p className="mt-2">
                          We reserve the right to suspend or terminate your account at any time for violation of these Terms & Conditions or for any other reason at our sole discretion. Upon termination, your right to use the service will immediately cease.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">9. Changes to Terms</h4>
                        <p className="mt-2">
                          We may update these Terms & Conditions from time to time. We will notify you of material changes by posting the new terms on this page and updating the "Last Updated" date. Continued use of the service after changes constitutes acceptance of the new terms.
                        </p>
                      </div>
                    </div>
                  )
                }

                if (activeSection === 'data-protection') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">Your Data Rights</h3>
                        <p className="mt-2">
                          Under the Kenya Data Protection Act, 2019, you have the following rights regarding your personal data:
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">1. Right to Access</h4>
                        <p className="mt-2">
                          You have the right to request a copy of the personal data we hold about you. You can view most of your data directly in your Profile and Academic Profile sections. For a complete data report, contact our Data Protection Officer.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">2. Right to Correction</h4>
                        <p className="mt-2">
                          If your personal data is inaccurate or incomplete, you may request that we correct it. You can update most information directly through your profile settings.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">3. Right to Deletion</h4>
                        <p className="mt-2">
                          You may request that we delete your personal data. Upon account deletion, we will remove your personal information from our active databases, except where we are required by law to retain certain records.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">4. Right to Restrict Processing</h4>
                        <p className="mt-2">
                          You may request that we restrict the processing of your personal data in certain circumstances, such as when you contest the accuracy of the data or object to processing.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">5. Right to Data Portability</h4>
                        <p className="mt-2">
                          You have the right to receive your personal data in a structured, commonly used format and to transmit it to another controller where technically feasible.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">6. Right to Object</h4>
                        <p className="mt-2">
                          You may object to processing of your personal data based on legitimate interests. We will cease processing unless we demonstrate compelling legitimate grounds for the processing.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">7. Right to Withdraw Consent</h4>
                        <p className="mt-2">
                          Where we rely on your consent as the legal basis for processing, you may withdraw that consent at any time. Withdrawal will not affect the lawfulness of processing prior to withdrawal.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">8. Right to Lodge a Complaint</h4>
                        <p className="mt-2">
                          You have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) in Kenya if you believe our processing of your personal data infringes on your rights.
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">How to Exercise Your Rights</h4>
                        <p className="mt-2">
                          To exercise any of these rights, please contact our Data Protection Officer at <strong>dpo@edupath.com</strong>. We will respond to your request within 30 days as required by law.
                        </p>
                      </div>
                    </div>
                  )
                }

                if (activeSection === 'security') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">Security Measures</h3>
                        <p className="mt-2">
                          We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">1. Data Encryption</h4>
                        <p className="mt-2">
                          All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption. This ensures that even if data is intercepted, it cannot be read without the decryption key.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">2. Access Controls</h4>
                        <p className="mt-2">
                          Access to personal data is restricted to authorized personnel who require it for their job responsibilities. All employees undergo data protection training and sign confidentiality agreements.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">3. Authentication</h4>
                        <p className="mt-2">
                          We use secure authentication mechanisms including password hashing and session management. We recommend enabling two-factor authentication (2FA) when available for added security.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">4. Regular Security Audits</h4>
                        <p className="mt-2">
                          We conduct regular security audits and vulnerability assessments to identify and address potential security risks. Our systems are monitored for suspicious activity 24/7.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">5. Data Minimization</h4>
                        <p className="mt-2">
                          We collect only the data necessary to provide our services. We regularly review and delete data that is no longer needed, in accordance with our data retention policy.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">6. Incident Response</h4>
                        <p className="mt-2">
                          In the event of a data breach, we will promptly notify affected individuals and the Office of the Data Protection Commissioner (ODPC) as required by the Kenya DPA within 72 hours of becoming aware of the breach.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">7. Third-Party Security</h4>
                        <p className="mt-2">
                          We carefully vet all third-party service providers to ensure they maintain appropriate security standards. All data processing agreements include strict data protection obligations.
                        </p>
                      </div>

                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Your Role in Security</h4>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>Use a strong, unique password for your account</li>
                          <li>Do not share your password with anyone</li>
                          <li>Log out from shared devices after use</li>
                          <li>Keep your contact information up to date for security alerts</li>
                          <li>Report suspicious activity immediately</li>
                        </ul>
                      </div>
                    </div>
                  )
                }

                if (activeSection === 'contact') {
                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900 dark:text-white">Contact Information</h3>
                        <p className="mt-2">
                          If you have questions, concerns, or complaints about our privacy practices or these legal documents, please contact us.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">Data Protection Officer</h4>
                        <div className="mt-2 space-y-1">
                          <p><strong>Email:</strong> dpo@edupath.com</p>
                          <p><strong>Address:</strong> Nairobi, Kenya</p>
                          <p><strong>Response Time:</strong> Within 30 days as required by law</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">General Inquiries</h4>
                        <div className="mt-2 space-y-1">
                          <p><strong>Email:</strong> support@edupath.com</p>
                          <p><strong>Phone:</strong> +254 700 000 000</p>
                          <p><strong>Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM EAT</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">Lodging a Complaint</h4>
                        <p className="mt-2">
                          If you are unsatisfied with our response to your privacy concern, you have the right to lodge a complaint with the regulatory authority:
                        </p>
                        <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
                          <p className="font-semibold">Office of the Data Protection Commissioner (ODPC)</p>
                          <p className="mt-1">Kenya Data Protection Commission</p>
                          <p>Nairobi, Kenya</p>
                          <p className="mt-1">Website: <a href="https://odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">https://odpc.go.ke</a></p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">Reporting a Data Breach</h4>
                        <p className="mt-2">
                          If you believe your data has been compromised or you suspect a security vulnerability in our systems, please report it immediately to security@edupath.com. We investigate all reports promptly.
                        </p>
                      </div>

                      <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Accessibility</h4>
                        <p className="mt-2">
                          We are committed to ensuring our legal information is accessible to all users. If you need this document in an alternative format (large print, audio, etc.), please contact us and we will accommodate your request.
                        </p>
                      </div>
                    </div>
                  )
                }
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

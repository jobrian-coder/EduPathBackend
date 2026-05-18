import { useState } from 'react'
import { Card, CardContent } from '../../../components/common/Card'
import { Link } from 'react-router-dom'

interface TermsAcceptanceModalProps {
  isOpen: boolean
  onAccept: () => void
  onCancel: () => void
  dataType: 'personal' | 'academic' | 'both'
}

export function TermsAcceptanceModal({ isOpen, onAccept, onCancel, dataType }: TermsAcceptanceModalProps) {
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToDataSharing, setAgreedToDataSharing] = useState(false)

  const canAccept = agreedToPrivacy && agreedToTerms && agreedToDataSharing

  if (!isOpen) return null

  const getDataText = () => {
    switch (dataType) {
      case 'personal':
        return 'your personal information (name, email, phone, bio, location, profile picture)'
      case 'academic':
        return 'your academic data (KCSE subjects, grades, mean points, exam year, school name)'
      case 'both':
        return 'your personal information and academic data (KCSE grades, mean points, school details)'
    }
  }

  const handleAccept = () => {
    if (canAccept) {
      // Store acceptance in localStorage
      const key = dataType === 'academic' ? 'edupath_terms_academic' : 'edupath_terms_personal'
      localStorage.setItem(key, new Date().toISOString())
      onAccept()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Data Consent Agreement
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Before proceeding, please review and accept the following terms regarding {getDataText()}.
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                I have read and understood the <Link to="/legal" target="_blank" className="text-teal-600 hover:underline">Privacy Policy</Link> and agree to the collection and processing of my personal data as described therein.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                I accept the <Link to="/legal" target="_blank" className="text-teal-600 hover:underline">Terms & Conditions</Link> and understand my rights and obligations under the Kenya Data Protection Act, 2019.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToDataSharing}
                onChange={(e) => setAgreedToDataSharing(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                I consent to EduPath using this data to provide personalized course recommendations, eligibility checks, and to improve the platform's services. I understand I can withdraw this consent at any time through my profile settings or by contacting dpo@edupath.com.
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold mb-1">Your Data Rights:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Right to access, correct, or delete your data</li>
              <li>Right to withdraw consent at any time</li>
              <li>Right to lodge a complaint with ODPC</li>
              <li>Data is encrypted and securely stored</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!canAccept}
              className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              I Agree & Continue
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function hasConsented(dataType: 'personal' | 'academic'): boolean {
  const key = dataType === 'academic' ? 'edupath_terms_academic' : 'edupath_terms_personal'
  return localStorage.getItem(key) !== null
}

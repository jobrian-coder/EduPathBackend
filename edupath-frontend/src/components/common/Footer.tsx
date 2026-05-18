
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 py-12 px-6 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-teal-600 dark:text-teal-400">EduPath</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm flex-1">
            Empowering students to find the best career paths and discover their true potential through intelligent guidance.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/directory" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Directory</Link></li>
            <li><Link to="/hubs" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Communities</Link></li>
            <li><Link to="/advisor" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">EduGuide AI</Link></li>
            <li><Link to="/courses/compare" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Compare Courses</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">About</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><Link to="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Our Story</Link></li>
            <li><Link to="/careers" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Team</Link></li>
            <li><Link to="/faq" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">FAQ</Link></li>
            <li><Link to="/legal" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Legal & Privacy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Contact</h4>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>Email: <a href="mailto:support@edupath.com" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">support@edupath.com</a></li>
            <li>Phone: +254 700 000 000</li>
            <li>Nairobi, Kenya</li>
          </ul>
        </div>
      </div>

      {/* KUCCPS CTA Banner */}
      <div className="max-w-7xl mx-auto mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-teal-600 dark:bg-teal-700 rounded-2xl px-6 py-5">
          <div className="text-center sm:text-left">
            <p className="text-white font-semibold text-base leading-snug">
              Ready to apply? Submit your course choices on the official KUCCPS portal.
            </p>
            <p className="text-teal-100 text-sm mt-0.5">
              Use EduPath to plan your choices, then head to KUCCPS to complete your application.
            </p>
          </div>
          <a
            href="https://students.kuccps.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-teal-700 font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-teal-50 transition-colors shadow-sm"
          >
            Go to KUCCPS Portal <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-500">
        <span>&copy; {new Date().getFullYear()} EduPath. All rights reserved.</span>
        <span className="flex items-center gap-1.5">
          Official placement portal:&nbsp;
          <a
            href="https://students.kuccps.net"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            students.kuccps.net <ExternalLink className="w-3 h-3" />
          </a>
        </span>
      </div>
    </footer>
  );
}

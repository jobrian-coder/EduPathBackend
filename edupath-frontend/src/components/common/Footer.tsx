
import { Link } from 'react-router-dom';

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
      
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-500">
        &copy; {new Date().getFullYear()} EduPath. All rights reserved.
      </div>
    </footer>
  );
}

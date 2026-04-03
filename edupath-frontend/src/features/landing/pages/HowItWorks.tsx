import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header element */}
      <div className="bg-teal-600 dark:bg-teal-700 w-full py-16 px-6 text-center shadow-md">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          How EduPath Works
        </h1>
        <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto">
          Your journey to finding the right career and educational path made simple, intuitive, and highly intelligent.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-6 space-y-16">
        
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 font-bold text-xl mb-2">1</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Discover Programs</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Explore our extensive directory of courses, degrees, and institutions across Kenya. Whether you're interested in technology, engineering, business, or the arts, we have comprehensive details waiting for you.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 font-bold text-xl mb-2">2</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Ask EduGuide AI</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Not sure where to start? <span className="font-bold text-teal-600 dark:text-teal-400">EduGuide</span> is our intelligent AI advisor. By answering a few simple questions about your interests and strengths, EduGuide recommends personalized paths directly tailored to you.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold text-xl mb-2">3</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Compare & Decide</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Use our course comparison tools to line up your top choices side by side. Compare variables like tuition, duration, and institution rankings to confidently make your choice.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xl mb-2">4</div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Join Communities</h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Jump into vibrant Hubs connected to your desired field. Connect with peers, alumni, and professionals to ask questions, share insights, and get real-world perspectives.
            </p>
          </div>
        </div>

      </div>

      <div className="pb-24 text-center">
        <Link 
          to="/auth" 
          className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          Get Started Now
        </Link>
      </div>

    </div>
  );
}

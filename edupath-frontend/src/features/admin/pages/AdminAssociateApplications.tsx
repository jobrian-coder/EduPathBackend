import { useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useToast } from '../hooks/useToast';
import {
  FileText,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Globe,
  Mail,
  Calendar,
  Send,
  Clock,
  History
} from 'lucide-react';
import api from '../../../services/api';
import type { AssociateApplication } from '../../../services/api';
import { downloadApplicationsPdf } from '../utils/adminPdf';

type Tab = 'pending' | 'awaiting' | 'history';

export default function AdminAssociateApplications() {
  const [tab, setTab] = useState<Tab>('pending');
  const [applications, setApplications] = useState<AssociateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [requestInfoQuestion, setRequestInfoQuestion] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadApplications(tab);
  }, [tab]);

  const loadApplications = async (currentTab: Tab) => {
    setLoading(true);
    try {
      const data = await api.adminApplications.listApplications(currentTab);
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
      addToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this application?')) return;
    setActionLoading(true);
    try {
      await api.adminApplications.approveApplication(id);
      addToast('Application approved', 'success');
      setExpandedId(null);
      loadApplications(tab);
    } catch (error) {
      addToast('Failed to approve application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      addToast('Please provide a rejection reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.adminApplications.rejectApplication(id, rejectReason);
      addToast('Application rejected', 'success');
      setExpandedId(null);
      setRejectReason('');
      loadApplications(tab);
    } catch (error) {
      addToast('Failed to reject application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (id: number) => {
    if (!requestInfoQuestion.trim()) {
      addToast('Please provide a question', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await api.adminApplications.requestApplicationInfo(id, requestInfoQuestion);
      addToast('Information requested', 'success');
      setExpandedId(null);
      setRequestInfoQuestion('');
      loadApplications(tab);
    } catch (error) {
      addToast('Failed to request information', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
    setRejectReason('');
    setRequestInfoQuestion('');
  };

  const handleDownloadPdf = () => downloadApplicationsPdf(applications);

  return (
    <AdminLayout onDownloadPdf={handleDownloadPdf}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Associate Applications</h1>
        <p className="text-slate-400">Review and manage Associate applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'pending'
              ? 'bg-teal-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Pending
        </button>
        <button
          onClick={() => setTab('awaiting')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'awaiting'
              ? 'bg-amber-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Awaiting Response
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'history'
              ? 'bg-slate-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No applications in this queue</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              isExpanded={expandedId === app.id}
              onToggle={() => toggleExpand(app.id)}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
              onRequestInfo={() => handleRequestInfo(app.id)}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              requestInfoQuestion={requestInfoQuestion}
              setRequestInfoQuestion={setRequestInfoQuestion}
              actionLoading={actionLoading}
              isHistory={tab === 'history'}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function ApplicationCard({
  app,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
  onRequestInfo,
  rejectReason,
  setRejectReason,
  requestInfoQuestion,
  setRequestInfoQuestion,
  actionLoading,
  isHistory,
}: {
  app: AssociateApplication;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestInfo: () => void;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  requestInfoQuestion: string;
  setRequestInfoQuestion: (v: string) => void;
  actionLoading: boolean;
  isHistory: boolean;
}) {
  const badgeColor =
    app.associate_type === 'MENTOR' ? 'bg-violet-500/20 text-violet-400' :
    app.associate_type === 'SOCIETY' ? 'bg-blue-500/20 text-blue-400' :
    'bg-amber-500/20 text-amber-400';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
      {/* Summary Card */}
      <div
        onClick={onToggle}
        className="p-5 cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-white">{app.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
                {app.associate_type}
              </span>
              {isHistory && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  app.application_status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                  app.application_status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {app.application_status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {app.hub}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {app.contact_email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(app.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-slate-500">
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Detail View */}
      {isExpanded && (
        <div className="p-5 border-t border-slate-800 bg-slate-800/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Applicant Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="text-white">{app.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Type</p>
                    <p className="text-white">{app.associate_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-400">Contact Email</p>
                    <p className="text-white">{app.contact_email}</p>
                  </div>
                </div>
                {app.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-slate-400">Location</p>
                      <p className="text-white">{app.location}</p>
                    </div>
                  </div>
                )}
                {app.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-slate-400">Website</p>
                      <a
                        href={app.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-300"
                      >
                        {app.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Bio</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{app.bio}</p>
              {app.admin_notes && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-xs text-amber-400 font-medium mb-1">Admin Notes / Question:</p>
                  <p className="text-xs text-slate-300">{app.admin_notes}</p>
                </div>
              )}
              {app.rejection_reason && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason:</p>
                  <p className="text-xs text-slate-300">{app.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isHistory && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={onApprove}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={onReject}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>

              {app.application_status === 'PENDING' && (
                <div className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={requestInfoQuestion}
                    onChange={(e) => setRequestInfoQuestion(e.target.value)}
                    placeholder="Ask a question to the applicant..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <button
                    onClick={onRequestInfo}
                    disabled={actionLoading || !requestInfoQuestion.trim()}
                    className="px-4 py-2.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              {app.application_status === 'PENDING' && (
                <div className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (required for rejection)..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

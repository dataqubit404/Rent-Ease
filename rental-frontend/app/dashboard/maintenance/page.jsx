'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, X, Clock, AlertCircle, CheckCircle, Circle, ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceAPI, propertiesAPI } from '../../../services/api';
import useAuthStore from '../../../hooks/useAuthStore';

const STATUS_STEPS = ['pending', 'in_progress', 'resolved', 'closed'];
const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-600',
};
const STATUS_ICONS = {
  pending: Clock,
  in_progress: AlertCircle,
  resolved: CheckCircle,
  closed: CheckCircle,
  rejected: X,
};

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ property_id: '', title: '', issue: '', category: 'other', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data } = await maintenanceAPI.getAll(params);
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  useEffect(() => {
    if (user?.role === 'tenant') {
      propertiesAPI.getAll({ limit: 50 }).then(({ data }) => setProperties(data.properties)).catch(() => {});
    } else if (user?.role === 'owner') {
      propertiesAPI.getMyProperties({ limit: 50 }).then(({ data }) => setProperties(data.properties)).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await maintenanceAPI.create(form);
      toast.success('Maintenance request submitted!');
      setShowForm(false);
      setForm({ property_id: '', title: '', issue: '', category: 'other', priority: 'medium' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    }
    setSubmitting(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await maintenanceAPI.updateStatus(id, { status });
      toast.success(`Marked as ${status}`);
      fetchData();
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Update failed'); 
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track and manage maintenance requests</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'in_progress', l: 'In Progress' }, { v: 'resolved', l: 'Awaiting Confirmation' }, { v: 'closed', l: 'Closed' }].map(f => (
          <button key={f.v} onClick={() => setFilterStatus(f.v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === f.v ? 'bg-brand-gradient text-white shadow-brand' : 'bg-white text-gray-600 border border-gray-200'}`}
          >{f.l}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Wrench size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">No maintenance requests</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-4">Create Request</button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => {
            const StatusIcon = STATUS_ICONS[req.status] || Circle;
            const currentStep = STATUS_STEPS.indexOf(req.status);
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{req.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{req.property?.title} · {req.category}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon size={14} className={
                      req.status === 'closed' ? 'text-green-600' :
                      req.status === 'resolved' ? 'text-blue-500' : 
                      req.status === 'in_progress' ? 'text-orange-500' : 'text-gray-400'
                    } />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6">{req.issue}</p>

                <div className="flex items-center gap-0 mb-4 px-2">
                  {STATUS_STEPS.map((step, idx) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        idx <= currentStep ? 'bg-brand-gradient shadow-brand' : 'bg-gray-100'
                      }`}>
                        {idx <= currentStep
                          ? <CheckCircle size={14} className="text-white" />
                          : <Circle size={12} className="text-gray-400" />}
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-0 transition-all ${idx < currentStep ? 'bg-brand-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-6 px-1">
                  <span>Pending</span><span>Working</span><span>Resolved</span><span>Closed</span>
                </div>

                <div className="flex justify-end border-t border-gray-50 pt-4">
                  {/* Owner actions */}
                  {user?.role === 'owner' && req.status !== 'resolved' && req.status !== 'closed' && (
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <button onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                          className="btn-ghost text-xs px-4 py-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-medium transition-colors">
                          Start Working
                        </button>
                      )}
                      {(req.status === 'pending' || req.status === 'in_progress') && (
                        <button onClick={() => handleStatusUpdate(req.id, 'resolved')}
                          className="btn-primary text-xs px-4 py-2 bg-green-600 hover:bg-green-700 shadow-none">
                          Mark Fixed (Resolved)
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Tenant actions */}
                  {user?.role === 'tenant' && req.status === 'resolved' && (
                    <div className="flex gap-3 bg-brand-50/50 p-3 rounded-xl border border-brand-100 items-center">
                      <p className="text-xs text-brand-700 font-medium mr-2">Owner marked this as fixed. Is it solved?</p>
                      <button onClick={() => handleStatusUpdate(req.id, 'closed')}
                        className="btn-primary text-xs px-4 py-2 bg-green-600 hover:bg-green-700 shadow-none">
                        Yes, Confirm Solved
                      </button>
                      <button onClick={() => handleStatusUpdate(req.id, 'in_progress')}
                        className="btn-ghost text-xs px-4 py-2 border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors">
                        No, Reopen
                      </button>
                    </div>
                  )}

                  {req.status === 'closed' && (
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                      <CheckCircle size={14} /> Solved and Confirmed
                    </div>
                  )}

                  {user?.role === 'owner' && req.status === 'resolved' && (
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold italic">
                      <Clock size={14} /> Awaiting Tenant Confirmation...
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-float">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl font-bold text-gray-900">New Maintenance Request</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Property</label>
                  <select required value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })} className="input-field">
                    <option value="">Select a property</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Title</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Leaking tap in bathroom" className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">
                      {['plumbing','electrical','hvac','appliance','structural','pest','other'].map(c => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input-field">
                      {['low','medium','high','urgent'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea required value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })}
                    placeholder="Describe the issue in detail..." rows={4} className="input-field resize-none" />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Edit2, CheckCircle } from 'lucide-react';
import useAuthStore from '../../hooks/useAuthStore';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col">
      <Navbar />
      <main className="flex-1 page-container py-12 pt-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-brand-gradient opacity-10" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-10">
              <div className="w-24 h-24 rounded-3xl bg-brand-gradient text-white flex items-center justify-center text-4xl font-bold shadow-brand">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-3xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 font-medium capitalize flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Shield size={14} className="text-brand-500" /> {user.role}
                </p>
              </div>
              <button onClick={() => setIsEditing(!isEditing)} className="btn-secondary h-10 px-5 text-sm flex items-center gap-2">
                <Edit2 size={14} /> Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <Mail size={16} /> <span className="text-sm font-medium">Email Address</span>
                </div>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
              
              <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <Phone size={16} /> <span className="text-sm font-medium">Phone Number</span>
                </div>
                <p className="font-semibold text-gray-900">{user.phone || 'Not provided'}</p>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 md:col-span-2">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                  <CheckCircle size={16} /> <span className="text-sm font-medium">Account Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="font-semibold text-gray-900">Active & Verified</p>
                </div>
              </div>
            </div>
            
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

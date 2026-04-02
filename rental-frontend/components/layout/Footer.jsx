'use client';
import Link from 'next/link';
import { Home, Github, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white pt-16 pb-8">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
                <Home size={18} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl">RentEase</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The modern platform for property rentals. Find your perfect home or list your property with ease.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Instagram, Github, Mail].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-white/5 hover:bg-brand-500 flex items-center justify-center transition-all duration-200 hover:scale-110">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {[
            { title: 'Explore', links: ['Browse Properties', 'Search by City', 'New Listings', 'Top Rated'] },
            { title: 'Hosts', links: ['List Your Property', 'Owner Dashboard', 'Pricing Guide', 'Host Resources'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><Link href="#" className="text-gray-400 text-sm hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2024 RentEase. All rights reserved.</p>
          <p className="text-gray-500 text-sm">Built with ❤️ for modern renters & owners</p>
        </div>
      </div>
    </footer>
  );
}

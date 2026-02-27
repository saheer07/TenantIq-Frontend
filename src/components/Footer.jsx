import React from 'react';
import { Mail, Phone, MapPin, Github, Linkedin, Facebook, Instagram, Trophy } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0F172A] border-t border-[#334155] text-slate-400 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-lg font-bold text-white">TenantIQ</span>
            <span className="text-xs text-slate-500 ml-2">© 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Support</a>
            <a href="#" className="hover:text-teal-400 transition-colors font-medium text-teal-500">Upgrade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
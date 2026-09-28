'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, Clock, MapPin, Sparkles, HelpCircle } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    artistName: '',
    email: '',
    inquiryType: 'Custom Beat Production',
    budget: '$500 - $1,000',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1000);
  };

  const faqs = [
    {
      q: 'How fast do I receive my beats after purchasing a license?',
      a: 'Instantly. Once checkout completes, untagged high-resolution MP3/WAV files and full stems (if selected) are delivered immediately with your contract agreement.',
    },
    {
      q: 'Can I upgrade my license later if my track blows up?',
      a: 'Yes! Simply reach out with your receipt order ID. The amount you originally paid will be discounted from the higher tier upgrade.',
    },
    {
      q: 'Do you offer custom exclusivity or 1-on-1 production?',
      a: 'Yes, AMITDIED works directly with select artists on full EP/album production, tailoring sound design and vocal arrangements to your unique style.',
    },
  ];

  return (
    <section id="contact" className="py-20 border-t border-zinc-900 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Direct Info & FAQs */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-mono uppercase tracking-widest mb-3">
                <Mail className="w-3.5 h-3.5" />
                <span>DIRECT INQUIRIES</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tight">
                WORK WITH AMITDIED
              </h2>
              <p className="text-zinc-400 text-sm font-mono mt-2 leading-relaxed">
                For custom production packages, major label clearances, exclusive buyouts, or mixing & sound engineering.
              </p>
            </div>

            {/* Quick Contact Cards */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="text-zinc-500 uppercase text-[10px]">Official Direct Mail</div>
                  <div className="text-white font-bold">contact@amitdied.com</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
                <Clock className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="text-zinc-500 uppercase text-[10px]">Typical Response Window</div>
                  <div className="text-white font-bold">Under 24 Hours (Mon - Sun)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center gap-3">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <div className="text-zinc-500 uppercase text-[10px]">Studio Location</div>
                  <div className="text-white font-bold">Berlin // Worldwide Remote Delivery</div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <h3 className="text-sm font-mono uppercase text-zinc-300 font-bold tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-red-500" />
                <span>FREQUENTLY ASKED QUESTIONS</span>
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 space-y-1.5">
                    <h4 className="text-xs font-display font-bold text-white">{faq.q}</h4>
                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 relative">
              <div className="mb-6">
                <h3 className="text-xl font-display font-black text-white uppercase">
                  SUBMIT A PRODUCTION BRIEF
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Fill out the parameters below to initiate a private consultation.
                </p>
              </div>

              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                        Artist / Producer Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. VEXX"
                        value={formData.artistName}
                        onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="artist@recordlabel.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                        Project Type
                      </label>
                      <select
                        value={formData.inquiryType}
                        onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-600 font-mono uppercase tracking-wider"
                      >
                        <option value="Custom Beat Production">Custom Beat Production</option>
                        <option value="Exclusive Beat Buyout">Exclusive Beat Buyout</option>
                        <option value="Full EP / Album Production">Full EP / Album Production</option>
                        <option value="Mixing & Mastering">Mixing & Mastering</option>
                        <option value="Sample Pack / Stems Inquiry">Sample Pack / Stems Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                        Estimated Budget
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-red-600 font-mono uppercase tracking-wider"
                      >
                        <option value="$250 - $500">$250 - $500</option>
                        <option value="$500 - $1,000">$500 - $1,000</option>
                        <option value="$1,000 - $3,000">$1,000 - $3,000</option>
                        <option value="$3,000+">$3,000+ (Major / Commercial)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1.5">
                      Vision, Reference Tracks & Timeline *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your sonic direction, reference links (SoundCloud/YouTube), delivery deadlines, or specific instruments required..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-600 font-mono leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-red-900/30"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'TRANSMITTING BRIEF...' : 'TRANSMIT PROJECT BRIEF'}</span>
                  </button>
                </form>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-500">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-display font-black text-white">
                    BRIEF TRANSMITTED SUCCESSFULLY
                  </h4>
                  <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong className="text-zinc-200">{formData.artistName}</strong>. 
                    AMITDIED will review your submission and respond to <span className="text-red-400">{formData.email}</span> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        artistName: '',
                        email: '',
                        inquiryType: 'Custom Beat Production',
                        budget: '$500 - $1,000',
                        message: '',
                      });
                    }}
                    className="mt-4 px-5 py-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs uppercase"
                  >
                    Send Another Inquiry
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-4">
          <div>
            © {new Date().getFullYear()} AMITDIED SOUND LAB. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <a href="#beats" className="hover:text-red-500 transition-colors">Beats</a>
            <a href="#licensing" className="hover:text-red-500 transition-colors">Licensing Terms</a>
            <a href="#credits" className="hover:text-red-500 transition-colors">Credits</a>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-400">DESIGNED FOR UNCOMPROMISING ARTISTS</span>
          </div>
        </div>

      </div>
    </section>
  );
}

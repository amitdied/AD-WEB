'use client';
import { Instagram, MessageSquare, Music, Star, Users } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export function Contact() {
  const IG_URL = "https://www.instagram.com/amitdied/";

  const contactOptions = [
    { title: "Custom Beat Inquiries", icon: Music, desc: "Get a bespoke instrumental tailored to your sound." },
    { title: "Exclusive Rights", icon: Star, desc: "Negotiate exclusive ownership for your next hit." },
    { title: "Artist Collabs", icon: Users, desc: "Connect for features, co-production, and projects." },
    { title: "General Inquiry (DM)", icon: MessageSquare, desc: "Questions? Just drop a message." }
  ];

  return (
    <section id="contact" className="py-32 px-6 max-w-5xl mx-auto relative z-10 text-center">
       <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-white leading-none">
          Let&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-900">Work</span>
       </h2>
       <p className="text-zinc-400 font-light text-lg mb-12 max-w-xl mx-auto">
          All business is handled directly through Instagram. Hit the DMs for beats, mixing, mastering, or collabs.
       </p>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left relative">
         {/* Decorative grid background behind grid */}
         <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none -m-10"></div>
         
         {contactOptions.map((opt, i) => (
           <a 
             key={i} 
             href={IG_URL} 
             target="_blank" 
             rel="noopener noreferrer"
             className="group block bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 p-8 hover:bg-zinc-800/80 hover:border-red-600/50 transition-all duration-300"
           >
             <div className="flex items-start justify-between">
               <div className="bg-zinc-950 p-3 rounded-sm text-red-500 mb-6 border border-zinc-800 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <opt.icon className="w-6 h-6" />
               </div>
               <Instagram className="w-5 h-5 text-zinc-600 group-hover:text-red-500 transition-colors" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide group-hover:text-red-400 transition-colors cursor-pointer">{opt.title}</h3>
             <p className="text-zinc-500 text-sm">{opt.desc}</p>
           </a>
         ))}
       </div>

       <div className="mt-16 flex justify-center">
         <a 
           href={IG_URL} 
           target="_blank" 
           rel="noopener noreferrer"
           className="relative overflow-hidden group bg-red-600 hover:bg-red-700 text-white px-10 py-5 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
         >
           <Instagram className="w-5 h-5" />
           <span>Connect With AMITDIED</span>
         </a>
       </div>

       <div className="mt-32 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-zinc-500 uppercase tracking-widest">
         <p>© 2026 AMITDIED. ALL RIGHTS RESERVED.</p>
         <div className="flex gap-6 items-center">
            <a href={IG_URL} target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition-colors flex items-center gap-2">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
            <Link href="/admin" className="hover:text-red-500 transition-colors text-xs text-zinc-600 hover:text-zinc-400 font-mono lowercase">
              [admin]
            </Link>
         </div>
       </div>
    </section>
  );
}

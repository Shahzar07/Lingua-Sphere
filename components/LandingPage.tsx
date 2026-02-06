
import React, { useEffect, useState, useRef } from 'react';
import { Icons } from '../constants';
import { GlassCard } from './GlassCard';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0; let targetY = 0;
    let currentX = 0; let currentY = 0;
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 50 && !isScrolled) setIsScrolled(true);
      if (scrollY <= 50 && isScrolled) setIsScrolled(false);
      if (heroRef.current) {
        heroRef.current.style.transform = `translate3d(0, ${scrollY * 0.4}px, 0)`;
        heroRef.current.style.opacity = `${Math.max(0, 1 - scrollY / 700)}`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.05);
      currentY = lerp(currentY, targetY, 0.05);
      if (blob1Ref.current) blob1Ref.current.style.transform = `translate3d(${currentX * -50}px, ${currentY * -50}px, 0)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translate3d(${currentX * 40}px, ${currentY * 40}px, 0)`;
      if (textRef.current) textRef.current.style.transform = `perspective(1000px) rotateX(${currentY * -2}deg) rotateY(${currentX * 2}deg)`;
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScrolled]);

  const marqueeText = " • PHONETIC MASTERY • ACADEMIC RIGOR • NATIVE PROSODY • CLINICAL ANALYSIS • ADAPTIVE CURRICULUM • HIGH-STAKES SIMULATION";

  // Duplicate testimonials for seamless loop
  const testimonials = [
    {
       quote: "The 'Mock Interview' mode is terrifyingly accurate. I practiced for 10 days straight. When I walked into my real interview at Barclays, I felt like I'd already done it.",
       author: "Elena R.",
       role: "Investment Banker, London",
       result: "Offer Accepted"
    },
    {
       quote: "I had the vocabulary but my accent was holding me back. LinguaSphere fixed my 'R' and 'L' phonemes in literally 48 hours.",
       author: "Kenji T.",
       role: "Architect, Silicon Valley",
       result: "Promotion"
    },
    {
       quote: "The nuance required for diplomatic French is immense. The AI Dean corrected intonation subtleties that human tutors missed for years.",
       author: "Sarah M.",
       role: "Diplomat, Paris",
       result: "C2 Certified"
    },
    {
        quote: "German technical vocabulary is one thing, but the cadence is another. This system deconstructed my speech pattern completely.",
        author: "Marcus L.",
        role: "Auto Engineer, Munich",
        result: "Lead Engineer"
    },
    {
        quote: "I needed to pitch to investors in Mandarin. The 'Stress Test' module prepared me for every interruption they threw at me.",
        author: "Priya K.",
        role: "Founder, Singapore",
        result: "Series A Closed"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative selection:bg-red-900/20">
      
      {/* 1. Dynamic Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div ref={blob1Ref} className="absolute top-[-10%] right-[-10%] w-[120vw] md:w-[800px] h-[120vw] md:h-[800px] bg-red-100/40 rounded-full blur-[80px] md:blur-[120px] will-change-transform" />
        <div ref={blob2Ref} className="absolute bottom-[-10%] left-[-10%] w-[100vw] md:w-[900px] h-[100vw] md:h-[900px] bg-slate-200/40 rounded-full blur-[80px] md:blur-[100px] will-change-transform" />
      </div>

      {/* 2. Responsive Navigation */}
      <nav className={`fixed top-0 w-full z-50 px-6 py-4 md:px-12 md:py-6 flex justify-between items-center transition-all duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3 md:gap-4 group cursor-default">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-academic-red text-white flex items-center justify-center rounded-lg font-serif font-bold text-lg md:text-xl shadow-lg group-hover:rotate-12 transition-transform duration-300">L</div>
          <span className="font-serif font-bold text-lg md:text-xl tracking-tight text-slate-900">LinguaSphere</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
            {['Methodology', 'Faculty', 'Results'].map(link => (
                <button key={link} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-academic-red transition-colors">{link}</button>
            ))}
            <button 
            onClick={onEnter}
            className="px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-academic-red transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
            >
            Admissions
            </button>
        </div>
      </nav>

      {/* 3. Hero Section */}
      <section className="relative z-10 min-h-[95vh] flex flex-col items-center justify-center px-4 pt-20 pb-12 perspective-1000">
        <div ref={heroRef} className="text-center max-w-7xl mx-auto space-y-8 md:space-y-12 will-change-transform">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-slate-200 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Enrollment Open for 2025
            </span>
          </div>
          
          <h1 ref={textRef} className="text-[3.5rem] leading-[0.9] md:text-[6rem] lg:text-[7.5rem] xl:text-[9rem] font-serif font-medium text-slate-900 tracking-tighter animate-in fade-in zoom-in duration-1000 delay-100 drop-shadow-sm origin-center will-change-transform">
            Speak with <br />
            <span className="italic text-academic-red relative inline-block">
                Authority
                <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-3 text-academic-red/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
            </span>.
          </h1>
          
          <p className="max-w-xl md:max-w-3xl mx-auto text-base md:text-2xl text-slate-500 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-4">
            The world's first <span className="font-semibold text-slate-900">AI-powered linguistic conservatory</span>. Master the nuance, prosody, and confidence of a native speaker in 15 days.
          </p>

          <div className="pt-8 md:pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 flex flex-col items-center gap-4">
            <button 
              onClick={onEnter}
              className="group relative px-10 py-5 md:px-14 md:py-7 bg-slate-900 text-white rounded-full overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95 w-full md:w-auto max-w-xs md:max-w-none"
            >
              <div className="absolute inset-0 bg-academic-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
              <div className="relative z-10 font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs flex items-center justify-center gap-4">
                Enter Admissions Office <Icons.ArrowRight />
              </div>
            </button>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              High-Fidelity Audio • No Credit Card Required
            </p>
          </div>
        </div>
      </section>

      {/* 4. Infinite Marquee */}
      <div className="relative z-20 bg-academic-red py-4 md:py-6 overflow-hidden transform -skew-y-2 border-y-4 border-double border-red-900/20 shadow-xl mb-24">
        <div className="animate-marquee-seamless whitespace-nowrap flex">
           {[...Array(6)].map((_, i) => (
             <span key={i} className="text-white font-serif font-bold text-2xl md:text-4xl italic tracking-tighter opacity-90 mx-4">{marqueeText}</span>
           ))}
        </div>
      </div>

      {/* 5. The Protocol Section */}
      <section className="py-24 md:py-32 bg-slate-50 relative z-20 overflow-hidden">
        {/* Technical Background Grid */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-20 md:mb-32 text-center space-y-6 reveal">
                <span className="inline-block py-1 px-3 border border-academic-red/30 rounded-full bg-academic-red/5 text-academic-red font-bold tracking-[0.2em] uppercase text-[10px]">
                    System Architecture
                </span>
                <h2 className="text-5xl md:text-7xl font-serif font-medium leading-none tracking-tight text-slate-900">
                    The Protocol
                </h2>
                <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
                    We replaced intuition with <span className="text-slate-900 font-medium">engineering</span>. A three-stage pipeline to reconstruct your linguistic capability.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-slate-200 z-0"></div>

                {[
                    { 
                        id: "01",
                        label: "ANALYSIS PHASE",
                        icon: <Icons.Speaker />, 
                        title: "Phonetic Mapping", 
                        desc: "High-frequency audio sampling captures your exact mouth positioning. We compare your phonemes against native datasets to identify micro-deviations." 
                    },
                    { 
                        id: "02",
                        label: "SYNTHESIS PHASE",
                        icon: <Icons.Brain />, 
                        title: "Adaptive Injection", 
                        desc: "The AI Dean constructs a recursive curriculum. It doesn't teach you what you know; it ruthlessly targets your specific accent bottlenecks." 
                    },
                    { 
                        id: "03",
                        label: "EVALUATION PHASE",
                        icon: <Icons.Zap />, 
                        title: "Stress Testing", 
                        desc: "Simulated high-stakes environments (Boardroom, Visa Interview) force you to maintain prosody under psychological pressure." 
                    }
                ].map((feature, i) => (
                    <div key={i} className={`group relative bg-white p-8 pt-12 rounded-2xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-academic-red/50 transition-all duration-500 reveal delay-${(i+1)*100}`}>
                        <div className="absolute -top-6 left-8 bg-slate-50 border border-slate-200 p-4 rounded-xl text-academic-red shadow-lg group-hover:scale-110 transition-transform duration-500 z-10">
                            {feature.icon}
                        </div>
                        <div className="absolute top-8 right-8 text-xs font-bold text-slate-300 font-mono group-hover:text-academic-red transition-colors">
                            {feature.id} // {feature.label}
                        </div>
                        
                        <div className="mt-8 space-y-4">
                            <h3 className="text-2xl font-serif font-bold text-slate-900 group-hover:translate-x-1 transition-transform">{feature.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </div>
                        
                        {/* Hover Line */}
                        <div className="absolute bottom-0 left-0 w-0 h-1 bg-academic-red group-hover:w-full transition-all duration-500 rounded-b-2xl" />
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 6. Faculty Section */}
      <section className="py-24 md:py-32 bg-white relative z-20 border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Col */}
            <div className="reveal space-y-10">
               <span className="inline-block py-1 px-3 border border-slate-200 rounded-full bg-slate-50 text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px]">
                    System Origin
               </span>
               <h2 className="text-5xl md:text-7xl font-serif text-slate-900 leading-[0.9] tracking-tight">
                  Founded by <span className="italic text-academic-red">Linguists</span>, <br/>Powered by Code.
               </h2>
               <p className="text-lg text-slate-500 leading-relaxed max-w-lg font-light">
                  The LinguaSphere engine was architected by a coalition of computational linguists and classical philologists. We rejected the "gamification" of language learning in favor of <span className="text-slate-900 font-medium">clinical precision</span>.
               </p>
               
               {/* Dean Credential Card */}
               <div className="pt-4">
                  <div className="relative group bg-slate-50 border border-slate-200 p-6 pr-10 rounded-xl inline-flex items-center gap-6 hover:shadow-lg hover:border-academic-red/20 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icons.Brain />
                      </div>
                      <div className="h-14 w-14 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                          <span className="font-serif font-bold text-slate-900 text-2xl italic">V</span>
                      </div>
                      <div>
                          <p className="text-slate-900 font-bold text-lg font-serif">Dr. Aris Vane</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span className="text-academic-red">Dean of Phonetics</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span>PhD, Oxford</span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
            
            {/* Right Col - Technical Report Card */}
            <div className="reveal delay-200 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-[2rem] transform -rotate-2 -z-10"></div>
                <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden group">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[10px] font-mono uppercase tracking-widest">System Metrics v3.1</span>
                        </div>
                        <div className="text-slate-400"><Icons.Database /></div>
                    </div>

                    {/* Body */}
                    <div className="p-8 md:p-10 space-y-10">
                        <div className="flex justify-between items-end border-b border-slate-100 pb-8">
                            <div>
                                <span className="text-6xl md:text-7xl font-serif font-bold text-slate-900 tracking-tighter">98<span className="text-2xl align-top text-slate-400">%</span></span>
                                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Placement Rate</span>
                            </div>
                            <div className="text-right">
                                 <span className="text-6xl md:text-7xl font-serif font-bold text-slate-900 tracking-tighter">12<span className="text-2xl align-top text-slate-400">k+</span></span>
                                 <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">Active Scholars</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Proprietary Audio Core', status: 'Active' },
                                { label: 'Real-time Accent Correction', status: 'Online' },
                                { label: 'Global Placement Network', status: 'Verified' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="text-[10px] font-mono text-emerald-700">{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Decorative Code/Line */}
                    <div className="h-1 w-full bg-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-1/3 bg-academic-red"></div>
                    </div>
                </div>
            </div>
         </div>
      </section>

      {/* 7. Results / Testimonials (Updated - Infinite Loop) */}
      <section className="py-24 md:py-32 bg-slate-50 relative z-20 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center mb-20 reveal">
            <span className="inline-block py-1 px-3 border border-slate-200 rounded-full bg-white text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px] mb-6">
                Output Validation
            </span>
            <h2 className="text-4xl md:text-6xl font-serif text-slate-900 mb-6">Distinguished <span className="text-academic-red italic">Alumni</span></h2>
            <p className="text-slate-500 max-w-xl mx-auto font-light text-lg">
                Our graduates don't just pass exams. They command rooms, lead negotiations, and close deals in their target language.
            </p>
         </div>

         <div className="relative w-full overflow-hidden mask-linear-fade">
             <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-r from-slate-50 to-transparent"></div>
             <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 z-10 bg-gradient-to-l from-slate-50 to-transparent"></div>
             
             <div className="animate-marquee-seamless flex gap-8 py-4">
                 {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                     <div key={i} className="flex-shrink-0 w-[350px] md:w-[450px]">
                         <GlassCard className="h-full bg-white border-slate-100 p-10 hover:border-academic-red/30 transition-all hover:shadow-2xl hover:-translate-y-2 group">
                             <div className="flex justify-between items-start mb-8">
                                <div className="flex gap-1 text-academic-red/80">
                                    {[1,2,3,4,5].map(s => <Icons.Star key={s} />)}
                                </div>
                                <span className="px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:bg-academic-red group-hover:text-white transition-colors">
                                    Verified
                                </span>
                             </div>
                             
                             <p className="text-lg md:text-xl text-slate-700 italic font-serif leading-relaxed mb-10">"{t.quote}"</p>
                             
                             <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                 <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-xl shadow-lg">
                                     {t.author[0]}
                                 </div>
                                 <div>
                                     <p className="font-bold text-slate-900">{t.author}</p>
                                     <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-medium">
                                         <span>{t.role}</span>
                                     </div>
                                 </div>
                                 <div className="ml-auto text-right">
                                    <span className="block text-[9px] font-bold text-slate-300 uppercase tracking-widest">Result</span>
                                    <span className="text-xs font-bold text-emerald-600">{t.result}</span>
                                 </div>
                             </div>
                         </GlassCard>
                     </div>
                 ))}
             </div>
         </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-slate-950 pt-24 pb-12 text-white border-t border-slate-900 relative overflow-hidden z-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        
        {/* Large Watermark */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none overflow-hidden">
            <span className="text-[15vw] leading-none font-black text-slate-900/50 font-serif tracking-tighter whitespace-nowrap">
                LINGUASPHERE
            </span>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-20">
                <div className="md:col-span-5 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white text-slate-950 flex items-center justify-center rounded-lg font-serif font-bold text-xl">L</div>
                        <span className="font-serif font-bold text-2xl tracking-tight">LinguaSphere</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-light">
                        The world's first computational linguistics conservatory. We deconstruct language into data, then reconstruct it as fluency.
                    </p>
                    <div className="flex gap-4 pt-4">
                        {['twitter', 'linkedin', 'github'].map((social, i) => (
                             <div key={i} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                                 <div className="w-3 h-3 bg-current rounded-sm"></div>
                             </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Admissions</h4>
                    <ul className="space-y-3">
                        {['Application Protocol', 'Tuition & Grants', 'Corporate Residencies', 'System Requirements'].map(link => (
                            <li key={link}>
                                <a href="#" className="text-xs md:text-sm text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{link}</a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Legal</h4>
                    <ul className="space-y-3">
                        {['Data Sovereignty', 'Biometric Consent', 'Academic Integrity', 'Cookie Protocol'].map(link => (
                            <li key={link}>
                                <a href="#" className="text-xs md:text-sm text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-block">{link}</a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="md:col-span-3 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">System Status</h4>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">Core Engine</span>
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Online</span>
                            </div>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-mono">Latency</span>
                            <span className="text-[10px] text-slate-500 font-mono">12ms</span>
                        </div>
                        <div className="h-px bg-slate-800 w-full"></div>
                        <div className="text-[10px] text-slate-600 font-mono">
                            v3.4.1-stable
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">
                        © 2025 LinguaSphere Systems Inc.
                    </p>
                    <p className="text-[10px] text-slate-700">
                        London • New York • Singapore • Tokyo
                    </p>
                </div>
                
                 <div className="flex items-center gap-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">English (UK)</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">Accessibility</span>
                 </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

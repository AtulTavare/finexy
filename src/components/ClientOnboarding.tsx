import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Code, Smartphone, TrendingUp, Bot, Sparkles, MessageSquare, Users, Target, Shield, HelpCircle } from 'lucide-react';
import { Button } from './ui';

interface Props {
  onComplete: () => void;
}

const milestones = [
  { icon: Code, label: '50+ Projects Delivered' },
  { icon: Check, label: 'Full-Stack Design & Dev' },
  { icon: Smartphone, label: 'Web & Mobile Apps' },
];

const services = [
  { icon: Code, name: 'Web Development', desc: 'Custom websites, web apps, and portals' },
  { icon: Smartphone, name: 'App Development', desc: 'Cross-platform mobile applications' },
  { icon: TrendingUp, name: 'Digital Marketing', desc: 'SEO, ads, and social media growth' },
  { icon: Bot, name: 'AI Automation', desc: 'Custom AI agents and workflow automation' },
  { icon: MessageSquare, name: 'WhatsApp AI Agents', desc: 'Smart WhatsApp business solutions' },
  { icon: Sparkles, name: 'Content Creation', desc: 'Brand content, visuals, and copywriting' },
];

const benefits = [
  { icon: Users, title: 'Expert Team', desc: 'Skilled developers, designers, and strategists dedicated to your success' },
  { icon: Target, title: 'Transparent Process', desc: 'Clear milestones, regular updates, and open communication at every step' },
  { icon: Shield, title: 'Proven Results', desc: 'Track record of delivering high-quality solutions that drive real business growth' },
  { icon: HelpCircle, title: 'Dedicated Support', desc: 'Ongoing maintenance and support to ensure your project thrives long-term' },
];

const screens = [
  { id: 'welcome', mobileMedia: 'https://res.cloudinary.com/dlkxwisy3/video/upload/v1785147324/infinity_onboarding_4_qufy7g.mp4', desktopMedia: 'https://res.cloudinary.com/dlkxwisy3/video/upload/v1785147324/infinity_onboarding_4_qufy7g.mp4', isVideo: true, desktopGradient: 'from-violet-950/70 via-fuchsia-900/30 to-transparent' },
  { id: 'services', mobileMedia: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80', desktopMedia: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80', isVideo: false, desktopGradient: 'from-orange-950/70 via-amber-900/30 to-transparent' },
  { id: 'benefits', mobileMedia: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80', desktopMedia: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80', isVideo: false, desktopGradient: 'from-emerald-950/70 via-teal-900/30 to-transparent' },
  { id: 'thankyou', mobileMedia: 'https://res.cloudinary.com/dlkxwisy3/video/upload/v1785147024/infinity_onboard_kuenkr.mp4', desktopMedia: 'https://res.cloudinary.com/dlkxwisy3/video/upload/v1785147024/infinity_onboard_kuenkr.mp4', isVideo: true, desktopGradient: 'from-sky-950/70 via-indigo-900/30 to-transparent' },
];

export default function ClientOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const screen = screens[step];
  const isLast = step === 3;

  const handleNext = () => { if (step < 3) setStep(s => s + 1); };

  const pageDots = (activeIdx: number) => (
    <div className="flex items-center gap-2">
      {screens.slice(0, 3).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeIdx ? 'w-8 bg-black' : i < activeIdx ? 'w-5 bg-gray-400' : 'w-1.5 bg-gray-300'}`} />
      ))}
    </div>
  );

  /* ─── Mobile Heroes ─── */

  const mobileHero = () => {
    switch (step) {
      case 0:
        return (
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            <motion.div className="absolute left-0 top-1/3 -translate-y-1/2 -rotate-6 w-20 h-20 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-lg flex items-center justify-center" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <Code size={32} className="text-white drop-shadow-lg" />
            </motion.div>
            <motion.div className="absolute z-10 w-24 h-24 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/40 shadow-xl flex items-center justify-center" animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Check size={36} className="text-white drop-shadow-lg" />
            </motion.div>
            <motion.div className="absolute right-0 top-2/3 -translate-y-1/2 rotate-6 w-20 h-20 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-lg flex items-center justify-center" animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
              <Smartphone size={32} className="text-white drop-shadow-lg" />
            </motion.div>
          </div>
        );
      case 1:
        return (
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            {services.slice(0, 3).map((s, i) => (
              <motion.div key={i} className={`absolute ${['-translate-x-12 -translate-y-4', 'translate-x-0 -translate-y-10', 'translate-x-12 -translate-y-4'][i]} w-16 h-16 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/30 shadow-lg flex items-center justify-center`} animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
                <s.icon size={28} className="text-white drop-shadow-lg" />
              </motion.div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            <div className="absolute w-40 h-40 rounded-full bg-black/5 blur-3xl" />
            {benefits.slice(0, 2).map((b, i) => (
              <motion.div key={i} className={`absolute ${['-translate-x-10 -rotate-12', 'translate-x-10 rotate-12'][i]} w-20 h-20 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/10 shadow-lg flex items-center justify-center`} animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}>
                <b.icon size={28} className="text-emerald-600" />
              </motion.div>
            ))}
          </div>
        );
      case 3:
        return (
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            <motion.div className="absolute w-48 h-48 rounded-full border-2 border-white/20" animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute w-36 h-36 rounded-full border-2 border-white/30" animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.15, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl flex items-center justify-center" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Check size={36} className="text-blue-600 drop-shadow-lg" />
            </motion.div>
            <div className="absolute w-32 h-32 rounded-full bg-white/10 blur-3xl" />
          </div>
        );
    }
  };

  /* ─── Desktop Content ─── */

  const desktopContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Welcome to <span className="text-violet-600">Infinity</span></h1>
            <p className="text-lg font-semibold text-violet-600">Innovations</p>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">We are a full-service digital agency that builds modern web applications, AI-powered solutions, and data-driven marketing strategies. Our mission is to help businesses like yours grow through technology that works.</p>
            <div className="flex flex-wrap gap-3">{milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200"><m.icon size={14} className="text-violet-600" /><span className="text-xs font-medium text-violet-800">{m.label}</span></div>
            ))}</div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Our <span className="text-orange-600">Services</span></h1>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">From concept to launch, we provide end-to-end digital solutions tailored to your business needs.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{services.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3"><div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0"><s.icon size={18} className="text-orange-600" /></div><div className="min-w-0"><p className="text-sm font-semibold text-gray-900">{s.name}</p><p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.desc}</p></div></div>
            ))}</div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">You're in <span className="text-emerald-600">Good Hands</span></h1>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">Choosing the right partner makes all the difference. Here's why our clients trust us.</p>
            <div className="space-y-3">{benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><b.icon size={15} className="text-emerald-600" /></div><div><p className="text-sm font-semibold text-gray-900">{b.title}</p><p className="text-xs text-gray-500 mt-0.5 leading-snug">{b.desc}</p></div></div>
            ))}</div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"><Check size={32} className="text-blue-600" /></div>
            <div><h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Thank You</h1><p className="text-lg font-semibold text-blue-600 mt-1">for Choosing Infinity Innovations</p></div>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed">We're excited to work with you. Your success is our priority, and we're committed to delivering exceptional results every step of the way.</p>
            <div className="w-full pt-2"><Button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold">Continue to Login <ArrowRight size={18} className="ml-2 inline" /></Button></div>
          </div>
        );
    }
  };

  /* ─── Mobile Content ─── */

  const mobileContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-5">
            {pageDots(0)}
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Welcome to <span className="text-lime-600">Infinity</span></h1>
            <p className="text-sm text-lime-600 font-semibold">Innovations</p>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">We build modern web apps, AI solutions, and marketing strategies to help your business grow.</p>
            <button onClick={handleNext} className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1">Get Started <ArrowRight size={17} /></button>
            <button onClick={onComplete} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer -mt-2">Skip</button>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center text-center space-y-5">
            {pageDots(1)}
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Our <span className="text-orange-500">Services</span></h1>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">End-to-end digital solutions tailored to your business needs.</p>
            <button onClick={handleNext} className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1">Next <ArrowRight size={17} /></button>
            <button onClick={onComplete} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer -mt-2">Skip</button>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center space-y-5">
            {pageDots(2)}
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">You're in <span className="text-emerald-600">Good Hands</span></h1>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">Here's why our clients trust us.</p>
            <button onClick={handleNext} className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1">Next <ArrowRight size={17} /></button>
            <button onClick={onComplete} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer -mt-2">Skip</button>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center space-y-5">
            {pageDots(3)}
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">Thank You</h1>
            <p className="text-sm text-blue-600 font-semibold">for Choosing Infinity Innovations</p>
            <p className="text-sm text-gray-500 max-w-[260px] leading-relaxed">We're excited to work with you. Your success is our priority.</p>
            <button onClick={onComplete} className="w-full h-12 bg-black text-white rounded-full text-sm font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer mt-1">Continue to Login <ArrowRight size={17} /></button>
          </div>
        );
    }
  };

  /* ─── Mobile Layout ─── */

  const mobileBadgeIcon = () => {
    if (step === 0 || step === 3) return <img src="/logo.png" alt="Infinity" className="w-10 h-10" />;
    if (step === 1) return <Sparkles size={28} className="text-orange-600" />;
    return <Shield size={28} className="text-emerald-600" />;
  };

  const mobileBackground = () => {
    if (screen.isVideo) {
      return (
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={screen.mobileMedia} type="video/mp4" />
        </video>
      );
    }
    return <img src={screen.mobileMedia} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />;
  };

  const mobileLayout = () => {
    return (
      <div className="md:hidden fixed inset-0 z-[200] flex flex-col bg-black">
        {/* Hero area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {mobileBackground()}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          {mobileHero()}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 flex items-center justify-center ring-4 ring-white/30">
            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              {mobileBadgeIcon()}
            </motion.div>
          </div>
        </div>
        {/* Content card */}
        <div className="bg-white/95 backdrop-blur-md rounded-t-[32px] px-6 pt-7 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
          {mobileContent()}
        </div>
      </div>
    );
  };

  /* ─── Desktop Layout ─── */

  const desktopLayout = () => {
    const accentBtn = ['bg-violet-600 hover:bg-violet-700', 'bg-orange-600 hover:bg-orange-700', 'bg-emerald-600 hover:bg-emerald-700', 'bg-blue-600 hover:bg-blue-700'];
    return (
      <div className="hidden md:flex w-full h-full">
        <div className="relative w-1/2 h-full overflow-hidden shrink-0">
          {screen.isVideo ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src={screen.desktopMedia} type="video/mp4" />
            </video>
          ) : (
            <img src={screen.desktopMedia} alt="" className="w-full h-full object-cover" loading="lazy" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-br ${screen.desktopGradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        <div className="relative flex-1 flex flex-col overflow-y-auto bg-white">
          <div className="flex items-center justify-start gap-2 pt-6 pb-2 px-10">
            {screens.slice(0, 3).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-black' : i < step ? 'w-5 bg-gray-400' : 'w-1.5 bg-gray-300'}`} />
            ))}
            <span className="text-[10px] text-gray-400 font-medium ml-2">{step + 1}/{screens.length}</span>
          </div>
          <div className="flex-1 flex items-center px-10 py-4">{desktopContent()}</div>
          <div className="px-10 pb-8 pt-2">
            {!isLast ? (
              <div className="flex flex-col items-start w-full space-y-3">
                <button onClick={handleNext} className={`w-full md:w-auto px-8 py-3 ${accentBtn[step]} text-white rounded-2xl text-sm font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer`}>Next <ArrowRight size={17} /></button>
                <button onClick={onComplete} className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">Skip</button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 flex items-center justify-center ring-4 ring-white/30">
          <motion.img src="/logo.png" alt="Infinity" className="w-12 h-12" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[200]"
      >
        {mobileLayout()}
        {desktopLayout()}
      </motion.div>
    </AnimatePresence>
  );
}

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
  {
    id: 'welcome',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80',
    gradient: 'from-violet-950/70 via-fuchsia-900/30 to-transparent',
    accent: 'violet',
  },
  {
    id: 'services',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80',
    gradient: 'from-orange-950/70 via-amber-900/30 to-transparent',
    accent: 'orange',
  },
  {
    id: 'benefits',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80',
    gradient: 'from-emerald-950/70 via-teal-900/30 to-transparent',
    accent: 'emerald',
  },
  {
    id: 'thankyou',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&q=80',
    gradient: 'from-sky-950/70 via-indigo-900/30 to-transparent',
    accent: 'blue',
  },
];

const accentColors: Record<string, { dot: string; dotActive: string; dotDone: string; btn: string; badge: string; heading: string }> = {
  violet: { dot: 'bg-gray-200', dotActive: 'bg-violet-600 w-10', dotDone: 'bg-violet-400 w-6', btn: 'bg-violet-600 hover:bg-violet-700', badge: 'ring-violet-200', heading: 'text-violet-600' },
  orange: { dot: 'bg-gray-200', dotActive: 'bg-orange-600 w-10', dotDone: 'bg-orange-400 w-6', btn: 'bg-orange-600 hover:bg-orange-700', badge: 'ring-orange-200', heading: 'text-orange-600' },
  emerald: { dot: 'bg-gray-200', dotActive: 'bg-emerald-600 w-10', dotDone: 'bg-emerald-400 w-6', btn: 'bg-emerald-600 hover:bg-emerald-700', badge: 'ring-emerald-200', heading: 'text-emerald-600' },
  blue: { dot: 'bg-gray-200', dotActive: 'bg-blue-600 w-10', dotDone: 'bg-blue-400 w-6', btn: 'bg-blue-600 hover:bg-blue-700', badge: 'ring-blue-200', heading: 'text-blue-600' },
};

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function WelcomeContent() {
  return (
    <motion.div variants={contentVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        Welcome to <span className="text-violet-600">Infinity</span>
      </motion.h1>
      <motion.p variants={itemVariants} className="text-lg font-semibold text-violet-600">
        Innovations
      </motion.p>
      <motion.p variants={itemVariants} className="text-sm sm:text-base text-gray-500 leading-relaxed">
        We are a full-service digital agency that builds modern web applications, AI-powered solutions,
        and data-driven marketing strategies. Our mission is to help businesses like yours
        grow through technology that works.
      </motion.p>
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-200">
            <m.icon size={14} className="text-violet-600" />
            <span className="text-xs font-medium text-violet-800">{m.label}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ServicesContent() {
  return (
    <motion.div variants={contentVariants} initial="initial" animate="animate" className="space-y-5">
      <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        Our <span className="text-orange-600">Services</span>
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm sm:text-base text-gray-500 leading-relaxed">
        From concept to launch, we provide end-to-end digital solutions tailored to your business needs.
      </motion.p>
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((s, i) => (
          <div key={i} className="flex items-start gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
              <s.icon size={18} className="text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function BenefitsContent() {
  return (
    <motion.div variants={contentVariants} initial="initial" animate="animate" className="space-y-5">
      <motion.h1 variants={itemVariants} className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        You're in <span className="text-emerald-600">Good Hands</span>
      </motion.h1>
      <motion.p variants={itemVariants} className="text-sm sm:text-base text-gray-500 leading-relaxed">
        Choosing the right partner makes all the difference. Here's why our clients trust us.
      </motion.p>
      <motion.div variants={itemVariants} className="space-y-3">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <b.icon size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{b.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{b.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ThankYouContent({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div variants={contentVariants} initial="initial" animate="animate" className="space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
      <motion.div variants={itemVariants} className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
        <Check size={32} className="text-blue-600" />
      </motion.div>
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">Thank You</h1>
        <p className="text-lg font-semibold text-blue-600 mt-1">for Choosing Infinity Innovations</p>
      </motion.div>
      <motion.p variants={itemVariants} className="text-sm sm:text-base text-gray-500 leading-relaxed">
        We're excited to work with you. Your success is our priority, and we're committed
        to delivering exceptional results every step of the way.
      </motion.p>
      <motion.div variants={itemVariants} className="w-full pt-2">
        <Button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold">
          Continue to Login <ArrowRight size={18} className="ml-2 inline" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default function ClientOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const screen = screens[step];
  const colors = accentColors[screen.accent];

  const renderContent = () => {
    switch (step) {
      case 0: return <WelcomeContent />;
      case 1: return <ServicesContent />;
      case 2: return <BenefitsContent />;
      case 3: return <ThankYouContent onComplete={onComplete} />;
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-[200] flex flex-col md:flex-row bg-white overflow-hidden"
      >
        {/* Image side - desktop left, mobile top */}
        <div className="relative w-full md:w-1/2 h-[40vh] md:h-full overflow-hidden shrink-0">
          <img
            src={screen.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${screen.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Content side - desktop right, mobile bottom */}
        <div className="relative flex-1 flex flex-col overflow-y-auto">
          {/* Progress dots */}
          <div className="flex items-center justify-center md:justify-start gap-2 pt-6 pb-2 px-6 md:px-10">
            {screens.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === step
                    ? `${colors.dotActive}`
                    : i < step
                      ? `${colors.dotDone}`
                      : 'bg-gray-200 w-5'
                }`}
              />
            ))}
            <span className="text-[10px] text-gray-400 font-medium ml-2">
              {step + 1}/{screens.length}
            </span>
          </div>

          {/* Content area */}
          <div className="flex-1 flex items-center px-6 md:px-10 py-4">
            {renderContent()}
          </div>

          {/* CTA area */}
          <div className="px-6 md:px-10 pb-8 pt-2">
            {step < 3 ? (
              <div className="flex flex-col items-center md:items-start w-full space-y-3">
                <button
                  onClick={() => setStep(s => s + 1)}
                  className={`w-full md:w-auto px-8 py-3 ${colors.btn} text-white rounded-2xl text-sm font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer`}
                >
                  Next
                  <ArrowRight size={17} />
                </button>
                <button
                  onClick={onComplete}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Floating logo badge - straddles the split */}
        <div className="absolute left-1/2 top-[40vh] md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-20 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 flex items-center justify-center ring-4 ring-white/30">
          <motion.img
            src="/logo.png"
            alt="Infinity"
            className="w-10 h-10 md:w-12 md:h-12"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Code, Palette, TrendingUp, Bot, Sparkles, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from './ui';

interface Props {
  onComplete: () => void;
}

const milestones = [
  { icon: Code, label: '50+ Projects Delivered' },
  { icon: Palette, label: 'Full-Stack Design & Dev' },
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
  { title: 'Expert Team', desc: 'Skilled developers, designers, and strategists dedicated to your success' },
  { title: 'Transparent Process', desc: 'Clear milestones, regular updates, and open communication at every step' },
  { title: 'Proven Results', desc: 'Track record of delivering high-quality solutions that drive real business growth' },
  { title: 'Dedicated Support', desc: 'Ongoing maintenance and support to ensure your project thrives long-term' },
];

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Infinity',
    subtitle: 'Innovations',
    render: () => (
      <div className="flex flex-col items-center text-center space-y-6">
        <img src="/logo.png" alt="Infinity" className="w-20 h-20 rounded-2xl shadow-lg" />
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to Infinity</h2>
          <p className="text-xl text-orange-600 font-semibold mt-1">Innovations</p>
        </div>
        <p className="text-base text-gray-600 max-w-lg leading-relaxed">
          We are a full-service digital agency that builds modern web applications, AI-powered solutions,
          and data-driven marketing strategies. Our mission is to help businesses like yours
          grow through technology that works.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
              <m.icon size={16} className="text-orange-600" />
              <span className="text-xs font-medium text-orange-800">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'services',
    title: 'Our Services',
    subtitle: 'What We Deliver',
    render: () => (
      <div className="flex flex-col items-center text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Services</h2>
        <p className="text-base text-gray-600 max-w-lg leading-relaxed">
          From concept to launch, we provide end-to-end digital solutions tailored to your business needs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {services.map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <s.icon size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'benefits',
    title: 'You\'re in Good Hands',
    subtitle: 'Why Choose Infinity',
    render: () => (
      <div className="flex flex-col items-center text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">You're in Good Hands</h2>
        <p className="text-base text-gray-600 max-w-lg leading-relaxed">
          Choosing the right partner makes all the difference. Here's why our clients trust us.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 text-left shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'thankyou',
    title: 'Thank You',
    subtitle: '',
    render: (onComplete: () => void) => (
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check size={40} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Thank You</h2>
          <p className="text-xl text-orange-600 font-semibold mt-1">for Choosing Infinity Innovations</p>
        </div>
        <p className="text-base text-gray-600 max-w-lg leading-relaxed">
          We're excited to work with you. Your success is our priority, and we're committed
          to delivering exceptional results every step of the way.
        </p>
        <Button onClick={onComplete} className="mt-4 px-8">
          Continue to Login <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    ),
  },
];

export default function ClientOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] bg-[#f4f5f7] flex items-center justify-center overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8 md:mb-12">
          {steps.slice(0, 3).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === step ? 'w-10 bg-[#f97316]' : i < step ? 'w-6 bg-emerald-500' : 'w-6 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {step < 3 ? current.render() : current.render(onComplete)}
          </motion.div>
        </AnimatePresence>

        {/* Step indicator + Next */}
        {step < 3 && (
          <div className="flex flex-col items-center mt-8 md:mt-12 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">
                Step {step + 1} of 3
              </span>
            </div>
            <button
              onClick={() => setStep(s => s + 1)}
              className="bg-[#18181b] text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Card } from '../../components/ui';
import { Infinity, Mail, Phone, MapPin } from 'lucide-react';

export default function ClientAbout() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">About Us</h1>

      <Card className="p-6 md:p-8 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#18181b] flex items-center justify-center">
            <Infinity size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Infinity Innovations</h2>
            <p className="text-sm text-gray-500">Your Technology Partner</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Infinity Innovations is a full-service digital agency specializing in web development, 
          mobile applications, AI automation, and digital marketing. We help businesses transform 
          their ideas into powerful digital solutions.
        </p>

        <div className="border-t border-gray-100 pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Our Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Website Development',
              'Web App Development',
              'App Development',
              'Digital Marketing',
              'Social Media Marketing',
              'Content Creation',
              'AI Agent Automation',
              'Custom AI Solutions',
            ].map(s => (
              <div key={s} className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Get in Touch</h3>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Mail size={16} className="text-gray-400 shrink-0" />
            <span>hello@infinityinnovations.com</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone size={16} className="text-gray-400 shrink-0" />
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400 shrink-0" />
            <span>Mumbai, India</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

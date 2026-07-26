import { Card } from '../../components/ui';
import { Scale, Shield, DollarSign, FileCode, Lock, Gavel } from 'lucide-react';

const TERMS = [
  {
    icon: FileCode,
    title: 'Services Provided',
    content: 'Infinity Innovations agrees to provide the digital services outlined in the project proposal or service agreement (the "Services"). These may include web development, mobile applications, AI automation, digital marketing, and related consulting. Any changes to scope must be agreed upon in writing by both parties.',
  },
  {
    icon: DollarSign,
    title: 'Payment Terms',
    content: 'Payment terms are specified in each project agreement. One-time fees are due upon invoice. Monthly recurring services are billed in advance and must be paid within 7 days of the invoice date. Late payments may incur a 2% monthly service charge on outstanding balances. Services may be paused or suspended if payment is more than 30 days overdue.',
  },
  {
    icon: Lock,
    title: 'Confidentiality',
    content: 'Both parties agree to maintain the confidentiality of all proprietary information shared during the course of the engagement. This includes business processes, source code, design assets, marketing strategies, and any data marked as confidential. This obligation survives the termination of the agreement.',
  },
  {
    icon: Shield,
    title: 'Intellectual Property',
    content: 'Upon full payment for Services, the client receives full ownership of the deliverables (source code, designs, and assets) created specifically for their project. Infinity Innovations retains the right to use pre-existing tools, libraries, and frameworks used in the development process, as well as the right to display completed work in its portfolio unless otherwise agreed.',
  },
  {
    icon: Scale,
    title: 'Limitation of Liability',
    content: 'Infinity Innovations shall not be liable for indirect, incidental, or consequential damages arising from the use of the deliverables. Liability is limited to the total amount paid by the client for the specific project giving rise to the claim. This does not apply in cases of gross negligence or willful misconduct.',
  },
  {
    icon: Gavel,
    title: 'Governing Law',
    content: 'These terms are governed by the laws of India. Any disputes shall first be attempted to be resolved through informal negotiation. If unresolved, disputes shall be settled by binding arbitration in Mumbai, India. Each party bears its own legal costs unless otherwise awarded by the arbitrator.',
  },
];

export default function ClientTerms() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Terms & Conditions</h1>

      <Card className="p-6 md:p-8 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Scale size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Terms of Service</h2>
            <p className="text-sm text-gray-500">Last updated: July 2026</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          These terms govern the relationship between Infinity Innovations ("we", "us", "our") and
          the client ("you", "your"). By engaging our services, you agree to these terms. If you
          have any questions, please contact us before proceeding.
        </p>

        <div className="space-y-6">
          {TERMS.map(({ icon: Icon, title, content }) => (
            <div key={title} className="border-t border-gray-100 pt-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

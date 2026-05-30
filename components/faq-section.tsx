'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'How quickly can you help me find an apartment?',
    answer: 'I typically respond within 10 minutes and can show you available units that match your criteria within 24 hours.',
  },
  {
    question: 'Do you help with move-ins and lease signing?',
    answer: 'Yes, I guide you through the entire process from application to lease signing. I handle all the paperwork and coordination.',
  },
  {
    question: 'What areas do you cover?',
    answer: 'I specialize in South Florida, covering Miami, Miami Beach, Coral Gables, Wynwood, and surrounding areas with access to 40+ communities.',
  },
  {
    question: 'Are there any fees for your service?',
    answer: 'No upfront fees. I work directly with property management companies. Your landlord covers leasing commissions.',
  },
  {
    question: 'Can you negotiate lease terms?',
    answer: 'Absolutely. I negotiate on your behalf for better rates, move-in incentives, and lease terms based on current market conditions.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked</h2>
      {FAQS.map((faq, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left"
          >
            <p className="font-medium text-gray-900 text-sm pr-2">{faq.question}</p>
            <ChevronDown
              className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

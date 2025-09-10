'use client';

import { useState } from 'react';
import faqJson from '../../../faq.json';

interface FaqItem {
  id: number;
  label: string;
  content: string;
}

export default function Faq() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-lg sm:text-xl text-gray-300 font-franklinGothic max-w-2xl mx-auto">
          Got questions? We've got answers! Find everything you need to know
          about HackUTA 2025.
        </p>
      </div>
      <div className="space-y-4">
        {faqJson.map((faq: FaqItem) => (
          <div
            key={faq.id}
            className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-400/50 faq-glow"
          >
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all duration-200"
              aria-expanded={openItem === faq.id}
              aria-controls={`faq-content-${faq.id}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-franklinGothic pr-4 leading-relaxed">
                  {faq.label}
                </h3>
                <div
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    openItem === faq.id ? 'rotate-180' : 'rotate-0'
                  }`}
                >
                  <svg
                    className="w-6 h-6 text-purple-300 group-hover:text-purple-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            <div
              id={`faq-content-${faq.id}`}
              className={`transition-all duration-300 ease-in-out ${
                openItem === faq.id
                  ? 'max-h-96 opacity-100'
                  : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="px-6 pb-6">
                <div className="w-full h-px bg-gradient-to-r from-purple-500/30 to-blue-500/30 mb-4"></div>
                <p className="text-gray-200 text-base sm:text-lg leading-relaxed font-franklinGothic">
                  {faq.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

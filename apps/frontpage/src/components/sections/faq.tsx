'use client';

import { Fragment, useState } from 'react';
import faqJson from '../../../faq.json';

// Type for the actual JSON data structure
type FaqJsonItem = {
  id: number;
  label: string;
  content:
    | string
    | Array<{
        type: string;
        value?: string;
        label?: string;
        href?: string;
      }>;
};

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
        {faqJson.map((faq: FaqJsonItem) => (
          <div
            key={faq.id}
            className="bg-gradient-to-r from-red-900/20 to-blue-900/20 backdrop-blur-sm border border-red-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:border-red-500/50 faq-glow"
          >
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-200"
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
                    className="w-6 h-6 text-red-300 group-hover:text-red-200"
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
                <div className="w-full h-px bg-gradient-to-r from-red-500/30 to-blue-500/30 mb-4"></div>
                <p className="text-gray-200 text-base sm:text-lg leading-relaxed font-franklinGothic">
                  {typeof faq.content === 'string'
                    ? faq.content
                    : faq.content.map((segment, index) => {
                        if (
                          segment.type === 'link' &&
                          segment.href &&
                          segment.label
                        ) {
                          return (
                            <a
                              key={`${segment.type}-${index}`}
                              href={segment.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-300 underline underline-offset-4 hover:text-red-200 transition"
                            >
                              {segment.label}
                            </a>
                          );
                        }

                        return (
                          <Fragment key={`${segment.type}-${index}`}>
                            {segment.value}
                          </Fragment>
                        );
                      })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

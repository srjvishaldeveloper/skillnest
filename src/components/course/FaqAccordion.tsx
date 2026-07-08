"use client";

import { useState } from "react";

type Faq = {
  id: number;
  question: string;
  answer: string;
};

const FaqAccordion = ({ faqs }: { faqs: Faq[] }) => {
  const [openId, setOpenId] = useState<number | null>(null);

  if (faqs.length === 0) {
    return (
      <p className="text-sm text-gray-400">No FAQs available yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className="rounded-lg border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <span>{faq.question}</span>
              <span
                className={`ml-2 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 text-sm text-gray-600 border-t border-gray-100">
                <p className="mt-2 whitespace-pre-line">{faq.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;

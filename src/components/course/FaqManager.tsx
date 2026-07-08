"use client";

import { useState } from "react";
import { createFaq, updateFaq, deleteFaq } from "@/lib/courseActions";

type Faq = {
  id: number;
  question: string;
  answer: string;
};

const FaqManager = ({
  courseId,
  faqs: initialFaqs,
}: {
  courseId: number;
  faqs: Faq[];
}) => {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setEditing(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    const res = await createFaq(courseId, question, answer);
    if (res.success) {
      setFaqs([
        ...faqs,
        { id: Date.now(), question: question.trim(), answer: answer.trim() },
      ]);
      resetForm();
    }
    setSaving(false);
  };

  const handleUpdate = async (faqId: number) => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    const res = await updateFaq(faqId, courseId, question, answer);
    if (res.success) {
      setFaqs(
        faqs.map((f) =>
          f.id === faqId
            ? { ...f, question: question.trim(), answer: answer.trim() }
            : f
        )
      );
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (faqId: number) => {
    if (!confirm("Delete this FAQ?")) return;
    const res = await deleteFaq(faqId, courseId);
    if (res.success) {
      setFaqs(faqs.filter((f) => f.id !== faqId));
    }
  };

  const startEdit = (faq: Faq) => {
    setEditing(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setShowForm(true);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">FAQs</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-skillBlue px-4 py-2 text-sm font-medium text-white"
          >
            + Add FAQ
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium mb-3">
            {editing ? "Edit FAQ" : "New FAQ"}
          </h3>
          <input
            type="text"
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
          />
          <textarea
            placeholder="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={() => (editing ? handleUpdate(editing) : handleCreate())}
              disabled={saving}
              className="rounded-md bg-skillGreen px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update" : "Add"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {faqs.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">
          No FAQs yet. Add frequently asked questions to help students understand the course better.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {faqs.map((faq, i) => (
          <div
            key={faq.id}
            className="flex items-start justify-between rounded-lg border border-gray-200 p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">
                {i + 1}. {faq.question}
              </p>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                {faq.answer}
              </p>
            </div>
            <div className="flex gap-1 ml-3 shrink-0">
              <button
                onClick={() => startEdit(faq)}
                className="rounded px-2 py-1 text-xs text-skillBlue hover:bg-skillBlue/10"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(faq.id)}
                className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqManager;

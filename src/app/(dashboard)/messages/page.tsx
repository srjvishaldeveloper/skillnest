"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type CourseInfo = {
  id: number;
  title: string;
  img: string | null;
  instructor: { id: string; name: string; img: string | null };
};

type ChatMessage = {
  id: number;
  senderId: string;
  senderRole: string;
  receiverId: string;
  receiverRole: string;
  courseId: number;
  message: string;
  createdAt: string;
  course?: { id: number; title: string };
};

export default function MessagesPage() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/messages/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data);
        setLoading(false);
      });
  }, []);

  const fetchMessages = useCallback(async (courseId: number) => {
    const res = await fetch(`/api/messages?courseId=${courseId}`);
    const data = await res.json();
    setMessages(data);
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMessages(selectedCourse.id);
    }
  }, [selectedCourse, fetchMessages]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedCourse || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: selectedCourse.id,
        message: input.trim(),
        receiverId: selectedCourse.instructor.id,
        receiverRole: "teacher",
      }),
    });
    if (res.ok) {
      setInput("");
      fetchMessages(selectedCourse.id);
    }
    setSending(false);
  };

  const deleteMessage = async (id: number) => {
    const res = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    if (res.ok && selectedCourse) {
      fetchMessages(selectedCourse.id);
    }
  };

  const deleteAllMessages = async () => {
    if (!selectedCourse || !confirm("Delete all messages in this conversation?")) return;
    const res = await fetch(`/api/messages?courseId=${selectedCourse.id}`, { method: "DELETE" });
    if (res.ok) {
      setMessages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="m-4 mt-0 flex h-[calc(100vh-100px)] gap-4">
      {/* Left Sidebar - Course list */}
      <div className="w-72 shrink-0 rounded-xl border border-gray-200 bg-white flex flex-col">
        <div className="border-b border-gray-100 p-4">
          <h2 className="text-sm font-bold text-gray-800">My Courses</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Select a course to chat
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {courses.length === 0 && (
            <div className="p-4 text-sm text-gray-400 text-center">
              {role === "teacher"
                ? "You have no courses yet."
                : "You are not enrolled in any courses."}
            </div>
          )}
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
                selectedCourse?.id === c.id
                  ? "bg-skillBlue/5 border-l-2 border-skillBlue"
                  : "border-l-2 border-transparent"
              }`}
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                {c.img && (
                  <Image
                    src={c.img}
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {c.title}
                </p>
                <p className="truncate text-[11px] text-gray-400">
                  {c.instructor.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right side - Chat area */}
      <div className="flex flex-1 flex-col rounded-xl border border-gray-200 bg-white">
        {!selectedCourse ? (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                💬
              </div>
              <p className="text-sm font-medium">Select a course to start chatting</p>
              <p className="text-xs mt-1">Ask questions to your instructor</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-skillBlue/20 to-skillPurple/20">
                  {selectedCourse.instructor.img && (
                    <Image
                      src={selectedCourse.instructor.img}
                      alt=""
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedCourse.instructor.name}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {selectedCourse.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/course/${selectedCourse.id}`}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  View Course
                </Link>
                <button
                  onClick={deleteAllMessages}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition"
                >
                  Delete All
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  <div className="text-center">
                    <p>No messages yet</p>
                    <p className="text-xs mt-1">
                      Send a message to {selectedCourse.instructor.name}
                    </p>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === selectedCourse.instructor.id ? false : true;
                return (
                  <div
                    key={msg.id}
                    className={`group flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "bg-skillBlue text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <div
                        className={`mt-1 flex items-center gap-2 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isMine ? "text-white/60" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMine && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="text-[10px] opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-300 transition"
                            title="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-100 px-5 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${selectedCourse.instructor.name} something...`}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-skillBlue transition"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-skillBlue text-white disabled:opacity-50 hover:bg-skillBlue/90 transition"
                >
                  {sending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

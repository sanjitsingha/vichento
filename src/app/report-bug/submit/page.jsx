"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useAuthContext } from "@/context/AuthContext";

const BugSubmitPage = () => {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    steps: "",
    expected: "",
    actual: "",
    severity: "medium",
    page: "",
    attachments: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        steps: formData.steps || null,
        expected_behavior: formData.expected || null,
        actual_behavior: formData.actual || null,
        severity: formData.severity || "medium",
        page_url: formData.page || null,
        attachments: formData.attachments || null,
        reporter_id: user?.id || null,
        reporter_email: user?.email || "",
        status: "open",
      };

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to submit bug report");
      }

      setSubmitted(true);
      setFormData({
        title: "",
        description: "",
        steps: "",
        expected: "",
        actual: "",
        severity: "medium",
        page: "",
        attachments: "",
      });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      console.error("Error submitting bug report:", err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full bg-white min-h-screen flex items-center justify-center pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 border border-green-100 mb-6">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-black font-creato mb-4">
            Thank You! 🎉
          </h2>
          <p className="text-lg text-gray-600 font-creato mb-8">
            Your bug report has been submitted successfully. I&apos;ll review it
            as soon as possible and work on a fix.
          </p>
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              You&apos;ll receive updates about this issue via email at{" "}
              <span className="font-semibold">
                {user?.email || "your email"}
              </span>
            </p>
            <div className="flex gap-4 justify-center flex-col md:flex-row">
              <Link
                href="/report-bug"
                className="px-8 py-3 border border-gray-200 text-black rounded-full font-semibold font-creato hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Report Another Bug
              </Link>
              <Link
                href="/"
                className="px-8 py-3 bg-black text-white rounded-full font-semibold font-creato hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen pt-20 pb-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Header */}
        <Link
          href="/report-bug"
          className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        <h1 className="text-4xl font-bold text-black font-creato mb-2">
          Report a Bug
        </h1>
        <p className="text-gray-600 text-lg font-creato mb-10">
          Help us fix issues and improve Vichento
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Bug Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Sign in button not working on mobile"
              className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the issue in detail. What were you trying to do?"
              rows="4"
              className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Steps to Reproduce{" "}
              <span className="text-black/40 text-xs">optional</span>
            </label>
            <textarea
              name="steps"
              value={formData.steps}
              onChange={handleChange}
              placeholder="1. Click on...
2. Then...
3. The bug occurs..."
              rows="4"
              className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-3 font-creato">
                Expected Behavior{" "}
                <span className="text-black/40 text-xs">optional</span>
              </label>
              <textarea
                name="expected"
                value={formData.expected}
                onChange={handleChange}
                placeholder="What should have happened?"
                rows="3"
                className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-3 font-creato">
                Actual Behavior{" "}
                <span className="text-black/40 text-xs">optional</span>
              </label>
              <textarea
                name="actual"
                value={formData.actual}
                onChange={handleChange}
                placeholder="What actually happened?"
                rows="3"
                className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>
          </div>

          {/* Page URL */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Page URL
            </label>
            <input
              type="url"
              name="page"
              value={formData.page}
              onChange={handleChange}
              placeholder="e.g., https://vichento.com/read/article-title"
              className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Severity <span className="text-red-600">*</span>
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-4 py-3 border-b border-gray-200  text-black focus:outline-none focus:border-black transition-colors"
            >
              <option value="low">
                Low - Minor issue, doesn&apos;t affect functionality
              </option>
              <option value="medium">
                Medium - Issue impacts some features
              </option>
              <option value="high">
                High - Major issue, affects core features
              </option>
              <option value="critical">
                Critical - Complete feature breakdown
              </option>
            </select>
          </div>

          {/* Additional Info */}
          <div>
            <label className="block text-sm font-semibold text-black mb-3 font-creato">
              Additional Information
            </label>
            <textarea
              name="attachments"
              value={formData.attachments}
              onChange={handleChange}
              placeholder="Browser, OS, screenshots, error messages, anything else that helps us understand the issue"
              rows="3"
              className="w-full px-4 py-3 border-b border-gray-200  text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-creato">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 cursor-pointer py-4 bg-black text-white rounded-lg font-semibold font-creato hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Bug Report"}
            </button>
            <p className="text-xs  text-gray-500 text-center mt-4">
              Thank you for helping us improve Vichento! 🙏
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BugSubmitPage;

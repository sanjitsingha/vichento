"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SUPPORT_EMAIL } from "@/lib/constants";

const inputClass =
  "w-full border-b border-black bg-transparent pb-1.5 font-creato text-black outline-none placeholder:text-sm placeholder:text-gray-400 focus:border-primary";

const Page = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    // Needs an `early_access` table (email text unique, name text, created_at timestamptz default now()).
    const { error } = await supabase
      .from("early_access")
      .insert([{ email: email.trim().toLowerCase(), name: name.trim() }]);
    // A duplicate email still counts as "you're on the list".
    setStatus(!error || error.code === "23505" ? "done" : "error");
  };

  return (
    <div className="w-full bg-[#fbfaf7]">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[800px] flex-col justify-center px-4 py-16">
        <p className="flex items-center gap-2 font-creato text-sm text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          Invite only
        </p>
        <h1 className="mt-4 font-creato text-5xl font-semibold tracking-tight text-black md:text-6xl">
          Early Access.
        </h1>
        <p className="mt-5 max-w-md text-base text-black/60">
          Be among the first to explore something new — built for deeper ideas and
          meaningful content.
        </p>

        {status === "done" ? (
          <div className="my-12 rounded-2xl border border-black/10 bg-white p-6">
            <p className="font-creato text-xl font-semibold text-black">You&apos;re on the list.</p>
            <p className="mt-2 text-sm text-black/60">
              We&apos;ll email {email} as soon as your invite is ready.
            </p>
          </div>
        ) : (
          <form className="my-12 flex flex-col gap-6 md:flex-row md:items-end" onSubmit={handleSubmit}>
            <label className="flex-1">
              <span className="sr-only">Email</span>
              <input
                className={inputClass}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="johndoe@gmail.com"
              />
            </label>
            <label className="flex-1">
              <span className="sr-only">Name</span>
              <input
                className={inputClass}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </label>
            <button
              className="shrink-0 bg-black px-10 py-3 font-creato text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Joining…" : "Join early access"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="-mt-6 mb-10 text-sm text-red-600">
            We couldn&apos;t add you right now. Email us at{" "}
            <a className="underline" href={`mailto:${SUPPORT_EMAIL}?subject=Early%20access`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            and we&apos;ll get you in.
          </p>
        )}

        <div className="font-creato">
          <h2 className="text-xl font-semibold text-black">Why join</h2>
          <ol className="mt-4 list-inside list-decimal space-y-1 text-[16px] text-black/60">
            <li>Early access before public launch</li>
            <li>Help shape the platform</li>
            <li>Be part of the first community</li>
          </ol>
        </div>

        <p className="mt-16 font-creato text-sm text-black/50">
          We respect your privacy. Unsubscribe anytime. Read our{" "}
          <Link href="/privacy-policy" className="underline hover:text-black">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default Page;

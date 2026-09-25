"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { generateUsername } from "@/lib/userUtils";
import { useAuthContext } from "@/context/AuthContext";
import AuthShell, {
  FormError,
  LegalNote,
  inputClass,
  primaryButtonClass,
} from "@/app/components/AuthShell";

// ---------------- AVATARS ----------------
const AVATARS = Array.from({ length: 12 }, (_, i) => `${i + 1}.png`);

const professions = [
  "Student",
  "Freelancer",
  "Working Professional",
  "Teacher",
  "Developer",
  "Designer",
  "Entrepreneur",
  "Content Creator",
  "Engineer",
  "Doctor",
  "Artist",
  "Other",
];

// ---------------- HELPERS ----------------
const getRandomAvatar = () => {
  const file = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  const { data } = supabase.storage.from("user_avatars").getPublicUrl(file);
  return data.publicUrl;
};


const passwordChecks = (pass) => [
  { ok: pass.length >= 8, label: "8+ characters" },
  { ok: /[A-Za-z]/.test(pass), label: "a letter" },
  { ok: /\d/.test(pass), label: "a number" },
  { ok: /[^A-Za-z0-9]/.test(pass), label: "a symbol" },
];

// ---------------- COMPONENT ----------------
export default function EmailSignup() {
  const router = useRouter();
  const { refreshProfile } = useAuthContext();

  const [step, setStep] = useState(1);

  // Step 1
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [profession, setProfession] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checks = passwordChecks(pass);
  const today = new Date().toISOString().split("T")[0];

  // ---------------- STEP 1 ----------------
  const handleSignupStep1 = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!checks.every((c) => c.ok)) {
      return setErrorMsg(
        "Password must be at least 8 characters and include a letter, a number and a symbol.",
      );
    }

    setStep(2);
  };

  // ---------------- STEP 2 ----------------
  const handleSignupStep2 = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !dob || !profession) {
      return setErrorMsg("Please fill in all fields.");
    }

    setLoading(true);
    try {
      const username = generateUsername(name);
      const avatar = getRandomAvatar();
      const profileData = {
        name: name.trim(),
        username,
        dob,
        profession,
        avatar,
      };

      // Keep profile details in user_metadata so /auth/callback can create
      // the users row after email confirmation if there is no session yet.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: profileData.name,
            avatar_url: avatar,
            username,
            dob,
            profession,
          },
        },
      });

      if (error) throw error;

      // Email confirmation required -> no session yet.
      if (!data.session) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      const { error: dbError } = await supabase
        .from("users")
        .upsert([{ id: data.user.id, email: email.trim(), ...profileData }]);

      if (dbError) throw dbError;

      await refreshProfile();
      router.replace("/");
    } catch (error) {
      setErrorMsg(error.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <AuthShell
        title="Tell us about you"
        subtitle="This helps us personalise Vichento for you."
        redirectIfAuthed={false}
      >
        <form onSubmit={handleSignupStep2} className="flex flex-col">
          <label htmlFor="name" className="text-xs text-gray-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="dob" className="mt-6 text-xs text-gray-700">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            max={today}
            className={inputClass}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
          />

          <p className="mb-3 mt-6 text-xs text-gray-700">What do you do?</p>
          <div className="flex flex-wrap gap-2">
            {professions.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={profession === p}
                onClick={() => setProfession(p)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  profession === p
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <FormError>{errorMsg}</FormError>

          <button type="submit" disabled={loading} className={`${primaryButtonClass} mt-8`}>
            {loading ? "Creating your account…" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorMsg("");
              setStep(1);
            }}
            className="mt-4 text-center text-sm text-black/60 underline underline-offset-2 hover:text-black"
          >
            Go back
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It only takes a moment to get started."
      footer={
        <>
          <Link
            href="/signup"
            className="text-sm text-black/60 underline underline-offset-2 hover:text-black"
          >
            ← All sign up options
          </Link>
          <LegalNote action="Continue" />
        </>
      }
    >
      <form className="flex flex-col" onSubmit={handleSignupStep1}>
        <label htmlFor="email" className="text-xs text-gray-700">
          Your email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="johndoe@hotmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />

        <label htmlFor="password" className="mt-6 text-xs text-gray-700">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className={`${inputClass} pr-8`}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-black"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {pass && (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {checks.map((c) => (
              <li key={c.label} className={c.ok ? "text-green-700" : "text-gray-400"}>
                {c.ok ? "✓" : "•"} {c.label}
              </li>
            ))}
          </ul>
        )}

        <FormError>{errorMsg}</FormError>

        <button type="submit" className={`${primaryButtonClass} mt-8`}>
          Continue
        </button>
      </form>
    </AuthShell>
  );
}

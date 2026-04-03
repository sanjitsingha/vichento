"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OAuthSuccess() {
  const { setUser } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const user = await account.get();
        setUser(user);
        router.push("/");
      } catch (err) {
        setError("OAuth login failed. Try again.");
      } finally {
        setLoading(false);
      }
    }, 2000); // delay to show animation

    return () => clearTimeout(timer);
  }, []);

  if (error)
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="flex items-center justify-center h-[calc(100vh-70px)] bg-white">
      <div className="animate-pulse">
        <Image src={'/logo.png'} alt="Logo" width={80} height={80} priority />
      </div>
    </div>
  );
}
  "use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { EnvelopeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CreateAccount from "./CreateAccount";

const SignIn = ({ open, onClose, children }) => {
  const [SignUpClicked, setSignUpsClicked] = useState(false);

  // Close popup when pressing ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
        setSignUpsClicked(false); // reset
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  if (!open) return null;

  // Close modal AND reset internal state
  const handleClose = () => {
    onClose();
    setSignUpsClicked(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center"
      onClick={handleClose} // CLOSE + RESET (fixed)
    >
      <div
        className="
          bg-white shadow-xl animate-fade-in
          w-full h-full rounded-none p-6 overflow-y-auto
          md:w-[480px] md:h-auto md:rounded-xl md:p-6
        "
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        {/* CLOSE BUTTON */}
        <div className="w-full flex justify-end">
          <button
            onClick={handleClose}
            className="cursor-pointer bg-gray-100 p-2 rounded-full"
          >
            <XMarkIcon className="size-6" />
          </button>
        </div>

        {/* LOGIN UI */}
        {!SignUpClicked ? (
          <div className="sign_in_Div">
            <h1 className="text-[26px] text-center mt-4">Welcome back.</h1>

            <div className="w-full mt-10 flex items-center flex-col">
              <button className="flex border w-[280px] border-black rounded-full py-2 pl-4 pr-16 items-center gap-8">
                <EnvelopeIcon className="size-5" />
                <p className="text-[16px]">Sign in with email</p>
              </button>

              <button className="flex border w-[280px] mt-4 border-black rounded-full py-2 pl-4 pr-16 items-center gap-8">
                <EnvelopeIcon className="size-5" />
                <p className="text-[16px]">Sign in with X</p>
              </button>

              <p className="text-[14px] mt-6">
                No account?{" "}
                <button
                  onClick={() => setSignUpsClicked(true)}
                  className="underline cursor-pointer"
                >
                  Create one
                </button>
              </p>

              <p className="text-[14px] mt-4">
                Forgot email or trouble signing in?{" "}
                <Link className="underline" href={"/"}>
                  Get help.
                </Link>
              </p>

              <p className="text-[11px] mt-6 text-center text-gray-500 max-w-[280px]">
                By clicking "Sign in", you accept Medium's Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </div>
        ) : (
          <CreateAccount onBack={() => setSignUpsClicked(false)} />
        )}

        {children}
      </div>
    </div>
  );
};

export default SignIn;

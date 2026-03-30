"use client";
import React from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthContext";

const LandingPage = () => {
  const { user, loading } = useAuthContext();

  console.log(user);
  return (
    <div className="w-full h-[calc(100vh-70px)] flex items-center">
      <div className="max-w-[1100px] w-full px-4 md:px-10 lg:px-0 flex flex-col h-full mx-auto">
        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col justify-center pt-10 md:pt-20">
          <p
            className="
            text-[40px] font-creato text-black leading-[45px]
            md:text-[60px] md:leading-[65px]
            lg:text-[90px] lg:leading-[95px]
            font-semibold
          "
          >
            Built on <br /> stories & ideas
          </p>

          <p className="text-[16px] md:text-[18px] font-creato lg:text-[20px] mt-6 lg:mt-10 text-gray-700">
            A space for thoughtful reading and meaningful writing
          </p>

          <Link
            className="
              mt-8 lg:mt-10 block w-fit
              bg-black text-white
              px-6 py-2 md:px-8 md:py-3
              rounded-full
              text-sm md:text-base
            "
            href={"/signin"}
          >
            Start Reading
          </Link>
        </div>

        {/* FOOTER LINKS */}
        <div className="w-full flex justify-end h-[60px] border-t border-gray-300">
          <div className="flex items-center h-full gap-3 md:gap-4 flex-wrap md:flex-nowrap py-2">
            {[
              "Help",
              "Status",
              "About",
              "Careers",
              "Press",
              "Blogs",
              "Privacy",
              "Terms",
            ].map((item) => (
              <Link
                key={item}
                className="text-[12px] md:text-[13px] text-gray-500"
                href={"/"}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

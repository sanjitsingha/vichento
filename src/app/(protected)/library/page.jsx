'use client'
import React from 'react'
import { IoBookmark } from 'react-icons/io5'
import { ArrowUpRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MdEditNote } from "react-icons/md";
import { EyeIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuthContext } from '@/context/AuthContext';

const page = () => {
  const { user } = useAuthContext();
  const [library, setLibrary] = useState([]);


  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
    id,
    article_id,
    articles (
      id,
      title,
      created_at
    )
  `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookmarks:", error);
      } else {
        console.log(data)
        setLibrary(data);
      }
    };

    fetchBookmarks();
  }, [user]);


  // console.log(library)

  return (
    <div className='w-full md:p-0 p-4'>
      <div className='mx-auto max-w-[800px] pt-6 md:pt-10'>
        <div className='w-full flex justify-between items-center pb-3 border-b border-gray-300 mb-6'>
          <p className='text-[24px] tracking-tight text-black font-creato'>Reading List</p>
          <IoBookmark className='text-gray-500' size={22} />
        </div>
        <div className='w-full h-fit border border-gray-300 rounded-lg'>
          <div className='w-full  h-fit p-4 flex'>
            <div className='h-full hidden md:block w-40 bg-red-300'>

            </div>
            <div className='flex w-full flex-1 items-center'>
              <div className=' grow'>
                <h1 className='font-creato text-[18px]   text-black'>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Temporibus, consectetur?</h1>
                <p className='font-creato text-[11px] text-gray-500 mt-1'>SANJIT SINGHA  |  25 MARCH 2026</p>
              </div>
              {/* <div className='flex gap-6 w-fit'>
                <Link className='cursor-pointer' href={'/'}>
                  <EyeIcon className='text-gray-400 hover:text-black transition-all duration-200 ease-in-out w-[18px] h-[18px]' />
                </Link>
                <Link className='cursor-pointer' href={'/'}>
                  <MdEditNote className='text-gray-400 hover:text-black transition-all duration-200 ease-in-out w-[22px] h-[22px]' />
                </Link>
                <Link className='cursor-pointer' href={'/'}>
                  <TrashIcon className='text-gray-400 hover:text-black transition-all duration-200 ease-in-out w-[16px] h-[16px]' />
                </Link>
              </div> */}
              <div className='flex gap-6 px-6 w-fit'>
                <Link className='cursor-pointer hover:bg-gray-300 rounded-full transition-all duration-200 ease-in-out p-2' href={'/'}>
                  <ArrowUpRightIcon className='text-gray-400 hover:text-black transition-all duration-200 ease-in-out w-[18px] h-[18px]' />
                </Link>

              </div>
            </div>
          </div>
          <hr className='w-full border-gray-300' />
        </div>
      </div>
    </div>
  )
}

export default page
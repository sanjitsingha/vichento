import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import React from 'react'
import Image from 'next/image'

import { RxShare2 } from "react-icons/rx";
import { BsThreeDots } from "react-icons/bs";
import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const page = () => {
  return (
    <div className='w-full p-4 md:p-0'>
      <div className='max-w-[800px] mx-auto pt-10'>
        <div className="w-full flex justify-between items-center pb-1 border-b border-gray-300 mb-4">
          <p className="text-[24px] tracking-tight text-black font-creato">Stats</p>
          <ArrowTrendingUpIcon className="text-gray-500 size-6" />
        </div>
        <div className='w-full grid grid-cols-3 gap-4  h-fit '>
          <div className='bg-white md:p-4 '>
            <p className='text-gray-500 text-xs'>Total Post</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>
          <div className='bg-white  md:p-4 '>
            <p className='text-gray-500 text-xs'>Total Views</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>
          <div className='bg-white  md:p-4 '>
            <p className='text-gray-500 text-xs'>Total Likes</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>

        </div>
        <div className='w-full  h-fit  grid grid-cols-1 md:grid-cols-2 gap-4 mt-10'>
          <div className='w-full p-2 md:p-4 border border-gray-300 rounded '>
            <p className='text-black text-xl font-creato font-bold'>Latest Published</p>
            <div className='w-full   h-full mt-4 '>
              <div className='w-full gap-3 h-fit border-b pb-4 border-gray-300  flex  rounded mt-2'>
                <div className=' overflow-hidden relative w-[130px] h-[100px]'>
                  <Image src={'/placeholder.png'} fill={true} alt='title' objectFit='cover' className='rounded-sm ' />
                </div>
                <div className='flex flex-col justify-center'>
                  <p className=' text-[16px]  line-clamp-1  text-gray-800 font-creato'>this will be the article title</p>
                  <p className='text-xs text-gray-400'>22-04-2026</p>
                </div>
              </div>
              <div className='w-full h-fit pt-4 '>
                <div className='w-full flex justify-between'>
                  <p className='text-gray-500 text-sm'>Total Views:</p>
                  <p className='text-black text-lg font-creato font-bold'>50</p>
                </div>
                <div className='w-full flex mt-4 justify-between'>
                  <p className='text-gray-500 text-sm'>Total Like:</p>
                  <p className='text-black text-lg font-creato font-bold'>50</p>
                </div>
                <div className="flex items-center justify-between gap-2 mt-4">
                  <button className='bg-gray-100 border-gray-300 border transition-all ease-in-out duration-200 w-fit mt-4 cursor-pointer active:scale-90 flex items-center gap-2 text-black text-sm px-6 rounded-full py-2'>
                    <p className='text-gray-500 text-sm font-creato'>Share</p>  <RxShare2 className='text-gray-500' size={20} />
                  </button>
                  <button className=' justify-center items-center transition-all ease-in-out duration-200 w-12 h-12 mt-4 cursor-pointer active:scale-80 flex  gap-2 text-black text-sm  rounded py-2'>
                    <BsThreeDots size={22} />
                  </button>
                </div>


              </div>

            </div>

          </div>
          <div className='w-full  border border-gray-300 p-2 md:p-4 rounded'>
            <p className='text-black text-xl font-creato font-bold'>Drafts</p>
            <div className='w-full  h-full '>
              <div className='w-full gap-2 h-fit pb-4 border-b  flex items-center border-gray-300 rounded mt-2'>
                <div className='h-full w-20 overflow-hidden'>
                  <Image src={'/placeholder.png'} width={80} height={80} alt='title' className='rounded-sm' />
                </div>
                <div className='flex flex-col justify-center'>
                  <p className='text-sm text-gray-800 font-creato'>this will be the article title</p>
                  <p className='text-xs text-gray-400'>22-04-2026</p>
                </div>
                <div className='ml-auto bg-black/10 py-[2px] px-2 rounded-sm h-fit'>
                  <p className='text-xs text-gray-400'>Draft</p>

                </div>
              </div>
              <div className='w-full gap-2 h-fit pb-4 border-b  flex items-center border-gray-300 rounded mt-2'>
                <div className='h-full w-20 overflow-hidden'>
                  <Image src={'/placeholder.png'} width={80} height={80} alt='title' className='rounded-sm' />
                </div>
                <div className='flex flex-col justify-center'>
                  <p className='text-sm text-gray-800 font-creato'>this will be the article title</p>
                  <p className='text-xs text-gray-400'>22-04-2026</p>
                </div>
                <div className='ml-auto bg-black/10 py-[2px] px-2 rounded-sm h-fit'>
                  <p className='text-xs text-gray-400'>Draft</p>

                </div>
              </div>
              <div className='w-full gap-2 h-fit pb-4 border-b  flex items-center border-gray-300 rounded mt-2'>
                <div className='h-full w-20 overflow-hidden'>
                  <Image src={'/placeholder.png'} width={80} height={80} alt='title' className='rounded-sm' />
                </div>
                <div className='flex flex-col justify-center'>
                  <p className='text-sm text-gray-800 font-creato'>this will be the article title</p>
                  <p className='text-xs text-gray-400'>22-04-2026</p>
                </div>
                <div className='ml-auto bg-black/10 py-[2px] px-2 rounded-sm h-fit'>
                  <p className='text-xs text-gray-400'>Draft</p>

                </div>
              </div>

            </div>


          </div>

        </div>
        <div className='w-full h-fit  border border-gray-300 rounded mt-2  md:mt-10 p-4'>
          <div className='flex items-center justify-between'>
            <p className='text-black font-semibold font-creato'>All Articles</p>
            <Link href={'/all-articles'} className='text-gray-500 text-xs font-creato flex items-center gap-2'>View all <ArrowUpRightIcon className='size-3.5' /></Link>
          </div>
          <div className='w-full mt-4 h-fit'>
            <div className='w-full gap-3 h-fit    flex  rounded mt-2'>
              <div className=' overflow-hidden relative w-[140px] h-[100px]'>
                <Image src={'/placeholder.png'} fill={true} alt='title' objectFit='cover' className='rounded-sm ' />
              </div>
              <div className='flex flex-col justify-center'>
                <p className=' text-[16px]  line-clamp-1  text-gray-800 font-creato'>this will be the article title</p>
                <p className='text-xs text-gray-400'>22-04-2026</p>
              </div>
            </div>
            <div className='w-full gap-3 h-fit    flex  rounded mt-2'>
              <div className=' overflow-hidden relative w-[140px] h-[100px]'>
                <Image src={'/placeholder.png'} fill={true} alt='title' objectFit='cover' className='rounded-sm ' />
              </div>
              <div className='flex flex-col justify-center'>
                <p className=' text-[16px]  line-clamp-1  text-gray-800 font-creato'>this will be the article title</p>
                <p className='text-xs text-gray-400'>22-04-2026</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

  )
}

export default page
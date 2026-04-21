import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline'
import React from 'react'


const page = () => {
  return (
    <div className='w-full'>
      <div className='max-w-[800px] mx-auto pt-10'>
        <div className="w-full flex justify-between items-center pb-1 border-b border-gray-300 mb-4">
          <p className="text-[24px] tracking-tight text-black font-creato">Stats</p>
          <ArrowTrendingUpIcon className="text-gray-500 size-6" />
        </div>
        <div className='w-full grid grid-cols-3 gap-4  h-30 '>
          <div className='bg-white p-4 border border-gray-300 rounded'>
            <p className='text-gray-500 text-xs'>Total Post</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>
          <div className='bg-white p-4 border border-gray-300 rounded'>
            <p className='text-gray-500 text-xs'>Total Views</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>
          <div className='bg-white p-4 border border-gray-300 rounded'>
            <p className='text-gray-500 text-xs'>Total Likes</p>
            <p className='text-black text-3xl mt-2 font-creato font-bold'>100</p>
          </div>

        </div>
        <div className='w-full  h-100 grid grid-cols-2 gap-4 mt-10'>
          <div className='w-full border border-gray-300 rounded '>

          </div>
          <div className='w-full  border border-gray-300 rounded'>

          </div>

        </div>

      </div>
    </div>

  )
}

export default page
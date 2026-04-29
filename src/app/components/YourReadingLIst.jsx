import React from 'react'

const YourReadingLIst = () => {
  return (
    <div className='w-full h-fit   p-2  '>
      <div className='flex items-center justify-between'>
        <p className='font-creato font-bold'>Saved Stories</p>
        <p className='text-sm text-gray-500'>view all</p>
      </div>
      <div className='py-4 border-b border-gray-300'>
        <div className='flex gap-2 items-center'>
          <div className='w-7 h-7 bg-red-200 rounded-full'></div>
          <div>
            <p className='text-sm text-gray-500'>Author Name</p>
          </div>

        </div>
        <div>
          <p className='text-xl font-medium font-creato mt-1'  >This is the title of the blog</p>
          <p className='text-sm text-gray-500'>Date . reading time</p>
        </div>

      </div>
    </div>
  )
}

export default YourReadingLIst
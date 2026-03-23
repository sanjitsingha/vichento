import React from 'react'

const page = () => {
  return (
     <div className='w-full'>
      <div className='max-w-[800px] w-full mx-auto pt-20'>
       
      <div>
         <h1 className='text-3xl font-semibold tracking-tighter'>Forgot Password!</h1>
         <p className='text-sm mt-2 text-black/60'>No worries. Enter your details below and we’ll help you regain access to your account.</p>
      </div>
      <form className='py-6 flex flex-col'  action=" ">
       <div className='w-full '>
         <label className='block text-xs font-medium mt-4 text-gray-700' htmlFor='email'>Registered Email</label>
        <input id='email' className=' font-semibold w-3/5  placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1 ' type="email "  />
         <label className='block text-xs font-medium mt-4 text-gray-700' htmlFor='name'>Name</label>
        <input id='name' className=' font-semibold w-3/5  placeholder:text-gray-500 placeholder:font-medium border-b border-gray-300 focus:border-b-black outline-none py-1' type="text "  />
       </div>
      
        
        <button className='bg-black px-8 text-sm cursor-pointer py-3 text-white font-medium mt-6 w-fit rounded-full'>Submit a request</button>
          <p className='text-sm text-black/60 mt-8'>Our team will contact you shortly with further instructions.</p>
        <p className='text-sm text-black/60 mt-1'>Need urgent help? Contact support at <span className='text-black font-semibold underline'>support@yourdomain.com</span> </p>
      </form>
      </div>
    </div>
  )
}

export default page
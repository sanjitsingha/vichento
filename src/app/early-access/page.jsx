import React from 'react'

const page = () => {
    return (
        <div className='w-full'>
            <div className='max-w-[800px] mx-auto h-[calc(100vh-70px)] flex-col flex  justify-center'>
                <h1 className='font-creato tracking-tight text-2xl font-semibold'>Early Access.</h1>
                <p className='text-sm mt-4 text-black/60'>
                    Be among the first to explore something new
                    built for deeper ideas and meaningful content.
                </p>
                <form className='flex gap-4 my-10' action="">
                    <input className='outline-none border-b-[1px] pb-1 placeholder:text-sm font-creato border-black' type="text" placeholder="johndoe@gmail.com" />
                    <input className='outline-none border-b-[1px] pb-1 placeholder:text-sm font-creato border-black' type="text" placeholder="John Doe" />
                    <button className='bg-black font-creato text-white cursor-pointer px-10 py-2.5' type='submit'>Join early access</button>
                </form>
                <div>
                    <div className='font-creato mt-14'>
                        <h2 className='text-xl font-semibold'>Why Join</h2>
                        <ul className='text-[16px] mt-4 list-decimal     list-inside text-black/60'>
                            <li>Early access before public launch  </li>
                            <li>Help shape the platform  </li>
                            <li>Be part of the first community</li>
                        </ul>

                    </div>
                     <div className='font-creato mt-20 text-sm text-black/50'>
                        <p>We respect your privacy. Unsubscribe anytime.</p>

                    </div>  
                </div>
            </div>


        </div>
    )
}

export default page
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAuthContext } from '@/context/AuthContext';
import Image from 'next/image';

const YourReadingLIst = () => {
  const { user } = useAuthContext();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          articles (
            id,
            title,
            slug,
            created_at,
            users!fk_author (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setBookmarks(data);
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, [user]);

  if (loading) {
    return (
      <div className='w-full h-fit p-2'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-creato font-bold'>Saved Stories</p>
          <Link href="/library" className='text-sm text-gray-500 hover:text-black'>view all</Link>
        </div>
        <div className='animate-pulse space-y-4'>
          {[1, 2].map((i) => (
            <div key={i} className='py-2'>
              <div className='h-3 bg-gray-200 rounded w-1/3 mb-2'></div>
              <div className='h-4 bg-gray-200 rounded w-full mb-1'></div>
              <div className='h-4 bg-gray-200 rounded w-2/3'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user || bookmarks.length === 0) {
    return (
      <div className='w-full h-fit p-2'>
        <div className='flex items-center justify-between mb-4'>
          <p className='font-creato font-bold'>Saved Stories</p>
        </div>
        <p className='text-sm text-gray-500'>No stories saved yet.</p>
      </div>
    );
  }

  return (
    <div className='w-full h-fit p-2'>
      <div className='flex items-center justify-between mb-4'>
        <p className='font-creato font-bold text-[16px]'>Saved Stories</p>
        <Link href="/library" className='text-sm text-gray-500 hover:text-black'>view all</Link>
      </div>
      
      <div className='flex flex-col gap-4'>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className='group'>
            <div className='flex gap-2 items-center mb-1'>
              <div className='w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-500 font-medium overflow-hidden'>
                {bookmark.articles?.users?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <p className='text-[13px] font-medium text-gray-600'>{bookmark.articles?.users?.name || 'Unknown'}</p>
            </div>
            
            <Link href={`/read/${bookmark.articles?.slug}`}>
              <p className='text-[15px] font-bold font-creato leading-tight text-gray-900 group-hover:underline decoration-gray-400'>
                {bookmark.articles?.title}
              </p>
            </Link>
            
            <p className='text-[12px] text-gray-500 mt-1.5'>
              {new Date(bookmark.articles?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              <span className='mx-1'>·</span>
              {Math.max(1, Math.ceil((bookmark.articles?.content?.length || 1000) / 1000))} min read
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YourReadingLIst;
'use client';
import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import Searchbar from '@/components/Searchbar';
import ImageGrid from '@/components/ImageGrid';
import { useInView } from 'react-intersection-observer';
import { useRouter } from 'next/navigation';
import { search, fetchInitialFeed } from '@/actions';

import { Ysabeau_SC, Quicksand } from "next/font/google";
const ysabeauSC = Ysabeau_SC({
    weight: ['500'], // Specify the weights you need
    subsets: ['latin'], // Specify the subsets you need
});
const quicksand = Quicksand({
    weight: ['400'], // Specify the weights you need
    subsets: ['latin'], // Specify the subsets you need
});

const GRID_SIZE = 21;
const Search = React.memo(({ params }) => {
  const router = useRouter();
  // const [username, initialFeed] = useContext(UserContext);
  const username = params.username;
  const [query, setQuery] = useState(null);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState('search');
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });
  const [offset, setOffset] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [loadMore, setLoadMore] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0,
  });
  useEffect(() => {
    const initializeFeed = async () => {
      try {
        const response = await fetchInitialFeed(username);
        setFilteredPosts(response["initialFeed"]);
        setAllPosts(response["initialFeed"]); 
      } catch (error) {
        console.error('Failed to fetch initial feed:', error);
      }
    };

    initializeFeed();
  }, [username]);
  const handleLogout = () => {
    console.log('Logged out');
  };

  const handleSearchMode = (mode) => {
    setSearchMode(mode);
    setQuery(null);
    if(mode === 'chat'){
        router.push(`/${username}/chat/`);
    }
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    setOffset(0);  
    setFilteredPosts([]);
    setAllPosts([]);
    setQuery(query);
    const posts = await search(username, query);
    setAllPosts(posts);
    setIsSearching(false);
  };
    
  const loadPosts = async () => {
    let posts;
    posts = allPosts.slice(offset, offset + GRID_SIZE);
    setFilteredPosts(filteredPosts? [...filteredPosts, ...posts] : posts);
    setOffset(offset + GRID_SIZE);
  }

  useEffect(() => {    
    if(inView && allPosts && allPosts.length > 0){
      loadPosts();
    }
  }, [inView, allPosts]);
  
  useEffect(() => {
    if(loadMore){
      loadPosts();
    }
  }, [offset, loadMore]);

  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      <div className="flex items-center justify-between px-10 pt-6 pb-4 w-full md:border-b md:border-solid md:border-neutral-200 max-md:flex-wrap max-md:px-5 max-md:max-w-full">
        <h1 className={`flex-1 ${ysabeauSC.className} text-2xl font-bold mb-2`}>Aventurier</h1>
        <div className="flex items-center justify-center md:w-[40%] max-md:w-full">
          <div className="flex-grow">
            <Searchbar onSearch={handleSearch} onModeChange={handleSearchMode}/>
          </div>
        </div>
        <div className='flex-1'></div>
      </div>
      
      <div className={`flex flex-col grow self-center md:mt-6 md:w-[60%] max-md:max-w-full`}>
      <div className="flex gap-1 self-start text-lg leading-6 text-black max-md:text-sm max-md:ml-2 max-md:mt-2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 w-6 max-md:w-4 aspect-square" >
          <path d="M3.9 21.0785V1.9H20.1V21.0785L12.5762 14.8086C12.2424 14.5305 11.7576 14.5305 11.4238 14.8086L3.9 21.0785Z" stroke="#222222" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
        <h2 className={`${quicksand.className} my-auto`}>Your Saved Posts</h2>
        </div>
        <div>
          {filteredPosts?.length > 0 ? (
            <ImageGrid posts={filteredPosts} />
          ) : (
            !(offset < allPosts.length) && !isSearching ? (
              <div className="flex justify-center items-center m-4">
                <p>No results</p>
              </div>
            ) : (
              isSearching && (
                <div className="flex justify-center items-center m-4">
                  <p>Loading...</p>
                </div>
              )
            )
          )}
          {offset < allPosts.length && <div ref={ref}>Loading...</div>}
        </div>
        </div>
    </div>
  );
});
Search.displayName = 'Search';
export default Search;

import { useState, useRef } from 'react';
import '@/globals.css'

function SearchBar({ onSearch, onModeChange}) {
  const [searchMode, setSearchMode] = useState('search');
  const queryRef = useRef(null);

  const handleToggle = (mode) => {
    setSearchMode(mode);
    onModeChange(mode);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    onSearch(queryRef.current.value);
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between justify-center px-2 py-2 text-sm bg-white font-semibold max-md:max-w-full">
      <div className="flex py-3 pr-2 pl-5 my-auto bg-white border border-neutral-200 border-solid shadow-md rounded-full text-neutral-800 flex-grow">
        <form onSubmit={handleSearch} className="flex-grow">
          <input
            type="text"
            ref={queryRef}
            placeholder={`${searchMode === 'search' ? 'Search' : 'Ask me anything'}`}
            className="w-full h-full pl-2 border-none rounded-full outline-none"
          />
        </form>
      </div>
      <div className="flex py-1.5 pr-0.5 pl-1.5 bg-stone-200 rounded-full ml-2">
        <button
          onClick={() => handleToggle('search')}
          className={`btn btn-toggle-default ${searchMode === 'search' ? 'btn-toggle py-1.5' : ''}`}
        >
          <svg className = {searchMode === 'search' ? 'stroke-stone-700' : 'stroke-stone-400'} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8.1"  strokeWidth="1.8"/>
            <path d="M22 22L16 16" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>

        </button>
        <button
          onClick={() => handleToggle('chat')}
          className={`btn btn-toggle-default ${searchMode === 'chat' ? 'btn-toggle py-1.5' : ''}`}
        >
          <svg width="25" height="25" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2C11.2081 2.0007 12.4004 2.27501 13.4873 2.80234C14.5743 3.32967 15.5277 4.09633 16.276 5.04479C17.0243 5.99324 17.5481 7.09886 17.808 8.27868C18.0679 9.45849 18.0573 10.6819 17.7769 11.857C17.4964 13.0321 16.9535 14.1284 16.1888 15.0637C15.4241 15.999 14.4575 16.749 13.3616 17.2573C12.2656 17.7657 11.0688 18.0192 9.86083 17.9989C8.65289 17.9785 7.46524 17.6849 6.387 17.14L6.266 17.075L2.621 17.985C2.55085 18.0026 2.47771 18.0048 2.40662 17.9915C2.33554 17.9781 2.2682 17.9495 2.20926 17.9075C2.15032 17.8656 2.10117 17.8114 2.06522 17.7486C2.02926 17.6859 2.00735 17.6161 2.001 17.544V17.462L2.015 17.379L2.925 13.735L2.862 13.615C2.40552 12.7137 2.12389 11.7341 2.032 10.728L2.007 10.346L2 10C2 7.87827 2.84285 5.84344 4.34315 4.34315C5.84344 2.84285 7.87827 2 10 2ZM10 3C8.77846 2.9998 7.57814 3.31926 6.5183 3.92664C5.45847 4.53402 4.57603 5.40816 3.95866 6.46221C3.3413 7.51626 3.01051 8.71351 2.99917 9.93499C2.98782 11.1565 3.29632 12.3597 3.894 13.425C3.9404 13.5078 3.96225 13.6022 3.957 13.697L3.943 13.791L3.187 16.812L6.211 16.058C6.27247 16.0428 6.33627 16.0394 6.399 16.048L6.49 16.069L6.577 16.108C7.51034 16.6305 8.55102 16.9322 9.61911 16.9898C10.6872 17.0475 11.7543 16.8596 12.7385 16.4406C13.7226 16.0216 14.5977 15.3826 15.2964 14.5727C15.9952 13.7628 16.499 12.8036 16.7693 11.7687C17.0395 10.7337 17.069 9.6506 16.8555 8.60249C16.6419 7.55437 16.191 6.56914 15.5374 5.72244C14.8837 4.87574 14.0448 4.1901 13.0849 3.71816C12.1249 3.24622 11.0696 3.00055 10 3ZM10.5 11C10.6249 10.9998 10.7454 11.0463 10.8378 11.1305C10.9301 11.2147 10.9876 11.3304 10.9989 11.4548C11.0102 11.5793 10.9745 11.7034 10.8988 11.8028C10.8231 11.9023 10.7129 11.9697 10.59 11.992L10.5 12H7.5C7.37505 12.0002 7.25455 11.9537 7.16222 11.8695C7.06988 11.7853 7.01241 11.6696 7.00112 11.5452C6.98984 11.4207 7.02554 11.2966 7.10122 11.1972C7.1769 11.0977 7.28705 11.0303 7.41 11.008L7.5 11H10.5ZM12.5 8C12.6249 7.99977 12.7454 8.04633 12.8378 8.13051C12.9301 8.21469 12.9876 8.33039 12.9989 8.45482C13.0102 8.57926 12.9745 8.70341 12.8988 8.80283C12.8231 8.90225 12.7129 8.96974 12.59 8.992L12.5 9H7.5C7.37505 9.00023 7.25455 8.95367 7.16222 8.86949C7.06988 8.78531 7.01241 8.66961 7.00112 8.54518C6.98984 8.42074 7.02554 8.29659 7.10122 8.19717C7.1769 8.09775 7.28705 8.03026 7.41 8.008L7.5 8H12.5Z" fill={searchMode=="chat"? '#292524':"#a8a29e"}/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SearchBar;

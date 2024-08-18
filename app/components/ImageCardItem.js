import ArrowButton from './ArrowButton';
import { useState } from 'react';

function ImageCardItem({ _id, user, postOwner, location, caption, images, videos, score}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  const handleToggleCaption = () => {
    setIsCaptionExpanded((prev) => !prev);
  };

  const renderCaption = () => {
    const maxLength = 100; // Maximum length before truncation
    if (isCaptionExpanded || caption.length <= maxLength) {
      return caption;
    }
    return `${caption.substring(0, maxLength)}...`;
  };

  return (
    <article className="flex flex-col grow">
      <div className="relative flex flex-col bg-zinc-400 h-full">
        <img
          loading="lazy"
          src={`${process.env.NEXT_PUBLIC_WORKER_URL}${images[currentImageIndex]}`}  
          className="object-cover w-full h-full "
        />        
        <ArrowButton onClick={handlePrevImage} direction={"left"} show={currentImageIndex > 0 && images[currentImageIndex].length > 1}/> 
        <ArrowButton onClick={handleNextImage} direction={"right"} show={currentImageIndex < images[currentImageIndex].length - 1}/>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {images.map((_, index) => (
            <span
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400'}`}
            ></span>
          ))}
        </div>
      </div>
      <div className="flex gap-5 mt-1">
        <div className="flex flex-col justify-center py-px text-neutral-500">
          <div className="flex flex-col">
            <p className="mt-1.5 text-sm">
              {renderCaption()}
              {caption.length > 100 && (
                <button onClick={handleToggleCaption} className="text-blue-500">
                  &nbsp; {isCaptionExpanded ? 'less' : 'more'}
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ImageCardItem;

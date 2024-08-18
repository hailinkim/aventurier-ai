import { useState } from 'react';
import ImageGridItem from './ImageGridItem';
import ImagePopup from './ImagePopup';

function ImageGrid({ posts }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentPopupImageIndex, setCurrentPopupImageIndex] = useState(0);
  const [isPopupVisible, setPopupVisible] = useState(false);

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setPopupVisible(true);
    setCurrentPopupImageIndex(0);
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedImageIndex(null);
    setCurrentPopupImageIndex(0);
  };

  const showPreviousPost = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : posts.length - 1));
    setCurrentPopupImageIndex(0);
  };

  const showNextPost = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex < posts.length - 1 ? prevIndex + 1 : 0));
    setCurrentPopupImageIndex(0);
  };

  const showPreviousPopupImage = () => {
    setCurrentPopupImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : posts[selectedImageIndex].images.length - 1));
  };

  const showNextPopupImage = () => {
    setCurrentPopupImageIndex((prevIndex) => (prevIndex < posts[selectedImageIndex].images.length - 1 ? prevIndex + 1 : 0));
  };

  return (
    <div className="md:mt-5 max-md:mt-2 max-md:max-w-full">
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post, index) => (
          <ImageGridItem
            key={index}
            src={post.images[0]}
            onClick={() => handleImageClick(index)}
            className="cursor-pointer w-full"
          />
        ))}
      </div>
      {isPopupVisible && selectedImageIndex !== null && (
        <ImagePopup
        posts={posts}
        selectedImageIndex={selectedImageIndex}
        currentPopupImageIndex={currentPopupImageIndex}
        closePopup={closePopup}
        showPreviousPost={showPreviousPost}
        showNextPost={showNextPost}
        showPreviousPopupImage={showPreviousPopupImage}
        showNextPopupImage={showNextPopupImage}
      />
      )}
    </div>
  );
}

export default ImageGrid;
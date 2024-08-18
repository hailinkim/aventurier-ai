import React from 'react';
import CloseButton from './CloseButton';
import ArrowButton from './ArrowButton';

const ImagePopup = ({ posts, selectedImageIndex, currentPopupImageIndex, closePopup, showPreviousPost, showNextPost, showPreviousPopupImage, showNextPopupImage }) => {
    const proxiedSrc = `${process.env.NEXT_PUBLIC_WORKER_URL}${posts[selectedImageIndex].images[currentPopupImageIndex]}`;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
        <div className="absolute top-2.5 right-2">
            <CloseButton onClick={closePopup} mode={"dark"} size={"md"} direction={"right"} />
        </div>
        <ArrowButton onClick={showPreviousPost} direction={"left"} mode={"post"} show={selectedImageIndex > 0 && posts.length > 1} />
        <div className="bg-white rounded-lg shadow-lg relative flex flex-col md:flex-row w-[75%] md:h-[75%]">
            <div className="relative flex items-center bg-black rounded-tr-lg rounded-tl-lg md:w-[60%]">
                <ArrowButton onClick={showPreviousPopupImage} direction={"left"} show={currentPopupImageIndex > 0 && posts[selectedImageIndex].images.length > 1} />
                <ArrowButton onClick={showNextPopupImage} direction={"right"} show={currentPopupImageIndex < posts[selectedImageIndex].images.length - 1} />
                <img src={proxiedSrc} alt="Selected" className="w-full h-full max-md:max-h-64 object-contain"/>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {posts[selectedImageIndex].images.map((_, index) => (
                    <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${currentPopupImageIndex === index ? 'bg-white' : 'bg-gray-400'} mx-1`}
                    ></span>
                    ))}
                </div>
            </div>
            <div className="pl-10 pr-10 pt-4 pb-4 flex flex-col justify-center md:w-[40%]">
            <p className={`overflow-y-scroll max-md:max-h-24 text-base max-md:text-xs`}>
                {posts[selectedImageIndex].caption}
            </p>
            </div>
        </div>
        <ArrowButton onClick={showNextPost} direction={"right"} mode={"post"} show={selectedImageIndex < posts.length - 1} />
        </div>
    );
};

export default ImagePopup;

import { useState } from 'react';

function PlaceCard({ name, address, rating, imageUrl }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : imageUrl.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < imageUrl.length - 1 ? prevIndex + 1 : 0));
  };

  return (
    <article className="flex flex-col grow w-30 max-w-sm h-auto p-4 bg-white rounded-lg shadow-lg overflow-y-auto">
      <div className="relative flex flex-col rounded-xl bg-zinc-400 h-full group">
        {imageUrl && imageUrl.length > 0 && (
            <img
              loading="lazy"
              src={imageUrl[currentImageIndex]}
              alt={`${name} location`}
              className="object-cover w-15 h-15 rounded-xl"
            />
        )}
        <button
          onClick={handlePrevImage}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
          style={{ width: '30px', height: '30px', lineHeight: '16px', textAlign: 'center' }}
        >
          &lt;
        </button>
        <button
          onClick={handleNextImage}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
          style={{ width: '30px', height: '30px', lineHeight: '16px', textAlign: 'center' }}
        >
          &gt;
        </button>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          {imageUrl.map((_, index) => (
            <span
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400'}`}
            ></span>
          ))}
        </div>
      </div>
      <div className="flex gap-5 mt-2.5">
        <div className="flex flex-col justify-center py-px text-neutral-500">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-black">{name}</h3>
            {/* <p className="mt-1.5 text-sm">{description}</p> */}
            <address className="mt-1.5 text-xs italic font-light">{address}</address>
          </div>
        </div>
        <div className="flex flex-col self-start mt-1.5 text-sm whitespace-nowrap">
          <div className="flex gap-1 text-neutral-800">
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/3519d40af15702780075f9b60fc8205a8e770dde6c66614b24f115b2669426e4?apiKey=8cee1f60e6bf4f68b8bdc4b0ce71214d&"
              alt=""
              className="shrink-0 self-start w-4 aspect-square fill-neutral-800"
            />
            <div>{rating}</div>
          </div>
          {/* <div className="self-start mt-2 ml-5 text-black max-md:ml-2.5">{price}</div> */}
        </div>
      </div>
    </article>
  );
}

export default PlaceCard;
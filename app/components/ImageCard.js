import ImageCardItem from './ImageCardItem';

const ImageCard = ({posts}) => {
  return (
    <div
      className="grid grid-cols-1 gap-10 pl-5 mt-10 max-md:px-5 max-md:max-w-full"
    >
      {posts.map((post, index) => (
        <div key={index}>
          <ImageCardItem {...post} />
        </div>
      ))}
    </div>
  );
};

export default ImageCard;


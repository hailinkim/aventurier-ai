const WORKER_URL = 'https://lingering-king-7401.haikim20.workers.dev/';
function ImageGridItem({ src,onClick,className }) {
  const proxiedSrc = `${WORKER_URL}${src}`;
  return (
    <div className={className} onClick={onClick}>
      <div className="flex flex-col grow justify-center self-stretch w-full bg-zinc-200">
        <img loading="lazy" src={proxiedSrc} alt="" className="w-full aspect-[1.09]" />
      </div>
    </div>
  );
}

export default ImageGridItem;
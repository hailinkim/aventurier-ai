const ArrowButton = ({ onClick, direction, show, mode="image"}) => {
    if(!show) return null;
    return(
        <svg viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={onClick} className={`arrow cursor ${direction==='left'?'left arrow-left-rotate':'right'} ${mode==="post"?'lg':'md'}`}>
            <circle cx="17" cy="15" r="15" fill="#D9D9D9"/>
            <path d="M15 20.8359L22.0001 15.0026L15 9.16917" stroke="#141414" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}
export default ArrowButton;
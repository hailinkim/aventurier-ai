const CloseButton = ({ onClick, mode, size, direction}) => (
    <svg viewBox="0 0 24 24" onClick={onClick} fill="none" xmlns="http://www.w3.org/2000/svg" className={`cursor ${size}`}>
        <g clipPath="url(#clip0_2302_3089)">
            <line x1="22.1364" y1="2.1364" x2="2.33741" y2="21.9354" stroke={`${mode==='dark'? 'white':'black'}`} strokeWidth="2"/>
            <line x1="2.33952" y1="2.66048" x2="22.1385" y2="22.4595" stroke={`${mode==='dark'? 'white':'black'}`} strokeWidth="2"/>
        </g>
        <defs>
            <clipPath id="clip0_2302_3089">
                <rect width="24" height="24" fill="white"/>
            </clipPath>
        </defs>
    </svg>
)
export default CloseButton;
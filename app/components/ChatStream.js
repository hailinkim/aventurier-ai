import { useState, useEffect, useRef } from 'react';

const ChatStream = ({ fullText, speed = 20, isStreaming, onStreamingComplete, onStreamingStop }) => {
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef(null);
  const indexRef = useRef(0); // Use useRef to persist index across renders

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        if (indexRef.current < fullText.length - 1) {
          setDisplayedText((prev) => prev + fullText[indexRef.current]);
          indexRef.current++;
        } else {
          clearInterval(intervalRef.current);
          if (indexRef.current === fullText.length - 1) {
            if (onStreamingComplete) {
              onStreamingComplete(); // Notify parent that streaming is complete
            }
          }
        }
      }, speed);
    }

    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, [fullText, speed, isStreaming, onStreamingComplete]);

  useEffect(() => {
    if (!isStreaming && fullText.length > 0) {
      clearInterval(intervalRef.current); // Stop streaming if isStreaming is false
      onStreamingStop(indexRef.current); // Use indexRef to send current index to parent
    }
  }, [isStreaming, onStreamingStop]);

  return <div>{displayedText}</div>;
};

export default ChatStream;
import React, { useState, useCallback } from 'react';

const ChatInput = React.memo(({ onSend, onStop, isStreaming }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue(''); // Clear the input field
    }
  }, [inputValue, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.nativeEvent.isComposing) {
      e.stopPropagation();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent the default action (submitting the form, etc.)
      handleSend();
    }
  }, [handleSend]);

  const handleButtonClick = useCallback(() => {
    if (isStreaming) {
      onStop();
    } else {
      handleSend();
    }
  }, [isStreaming, handleSend, onStop]);

  return (
    <div className="chat-input mt-4 flex">
      <div className="relative flex-grow">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="p-2 w-full border border-gray-300 rounded pr-10"
        />
        <button
          onClick={handleButtonClick}
          // disabled={isStreaming && !inputValue.trim()}
          className="absolute inset-y-0 right-0 flex items-center pr-2"
        >
          {isStreaming ? (
            <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="4" width="16" height="16" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
              <svg width="12" height="12" viewBox="0 0 14 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 1V15M7 1L13 7M7 1L1 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
export default ChatInput;

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
          disabled={isStreaming && !inputValue.trim()}
          className="absolute inset-y-0 right-0 flex items-center pr-2"
        >
          {isStreaming ? (
            <span className="text-red text-xl">&#9632;</span> // Square symbol
          ) : (
            <span className="text-blue-500 text-xl">&#8593;</span> // Upward arrow symbol
          )}
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
export default ChatInput;

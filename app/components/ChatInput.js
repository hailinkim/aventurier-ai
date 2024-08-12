import React, { useState, useCallback, useEffect } from 'react';

const ChatInput = React.memo(({ onSend, onStop, isStreaming }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue(''); // Clear the input field
    }
  };

  return (
    <div className="chat-input mt-4 flex">
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Type your message here..."
        className="p-2 flex-grow border border-gray-300 rounded mr-2"
      />
      <button onClick={handleSend} disabled={isStreaming} className="p-2 bg-blue-500 text-white rounded mr-2">
        Send
      </button>
      <button onClick={onStop} disabled={!isStreaming} className="p-2 bg-red-500 text-white rounded">
        Stop
      </button>
    </div>
  );
});

export default ChatInput;

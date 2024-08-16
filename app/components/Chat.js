import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatStream from '@/components/ChatStream';
import ChatInput from '@/components/ChatInput';
import Map from '@/components/Map';
import {fetchSourcePosts} from '@/actions';

export default function Chat(props) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const fullTextRef = useRef("");
  const isStreamingRef = useRef(false);

  const streamResponse = async (query, history) => {
    try {
      const response = await fetch('/api/python', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username:props["username"], question: query, chat_history: history}),
      }); 
      let done = false;
      let text = '';
      let sources = [];
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const stream_text = decoder.decode(value, { stream: true });
          const regex = /Sources: ([\s\S]*?)\s*-+/;
          const match = stream_text.match(regex);
          if(match){
            console.log(match[1]);
            sources = JSON.parse(match[1]); //parse document id string into a list
            continue;
          }
          text += stream_text;
          fullTextRef.current = text; // Update the full text as it streams
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1].text = fullTextRef.current;
            return newMessages;
          });
      }
      //add sources after streaming is done
      const fetchedSources = await fetchSourcePosts(sources);
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        if (fetchedSources) {
          newMessages[newMessages.length - 1].sources = fetchedSources;
        }
        return newMessages;
      });
      setIsStreaming(false);
      setChatHistory((prevChatHistory) => [...prevChatHistory, {role: "assistant", content: text }]);
    } catch (error) {
      console.error('Streaming error:', error);
    }
  };

  const handleSend = useCallback((userInput) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userInput, isUser: true },
      { text: 'Loading...', isUser: false },
    ]);
    setIsStreaming(true);
    streamResponse(userInput, chatHistory);
  }, [chatHistory]);

  const handleStop = useCallback(() => {
    setIsStreaming(false);
    isStreamingRef.current = false; // Set ref to false to stop streaming
  }, []);

  const handleStreamingComplete = useCallback(() => {
    setIsStreaming(false); // Set streaming to false when done
  }, []);

  const handleStreaming = useCallback(() => {
    setIsStreaming(true); // Set streaming to false when done
  }, []);

  const handleStreamingStop = useCallback((currentIndex) => {
    console.log("Streaming stopped at index:", currentIndex);
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      // Check if the last message is not complete and is not from the user
      if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser) {
        newMessages[newMessages.length - 1].text = newMessages[newMessages.length - 1].text.slice(0, currentIndex); // Update the last message
      }
      return newMessages;
    });
  }, []);

  return (
    <div className="flex h-screen p-4">
      <div className="flex flex-col flex-grow">
        <h1 className="mb-4 text-2xl font-bold">Aventurier</h1>
        <div className="flex-grow overflow-hidden">
          {/* <div className="sticky top-0">{sourcePosts.length > 0 && <Map />}</div> */}
          <div className="flex flex-col border border-gray-300 p-4 mt-2 rounded-lg h-full overflow-y-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`my-2 p-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                  message.isUser
                    ? 'bg-blue-500 text-white self-end'
                    : 'bg-gray-100 text-black self-start'
                }`}
              >
                {!message.isUser && message.sources && <Map/>}
                <p>{message.text}</p>
                {!message.isUser && message.sources && (
                  <div className="mt-2">
                    <p>Click below to view related IG posts:</p>
                    <div className="flex space-x-2">
                      {message.sources.map((post, postIndex) => (
                        <div key={postIndex}>
                          <a href={post.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={`https://lingering-king-7401.haikim20.workers.dev/${post.images[0]}`}
                              style={{ width: '150px', height: '150px' }}
                              alt="source post"
                            />
                          </a>
                        </div>))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white">
          <ChatInput onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />
        </div>
      </div>
    </div>
  );
}
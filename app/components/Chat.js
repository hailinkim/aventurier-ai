import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatStream from '@/components/ChatStream';
import ChatInput from '@/components/ChatInput';
import Map from '@/components/Map';
import {fetchSourcePosts} from '@/actions';
import { Ysabeau_SC } from "next/font/google";

const ysabeauSC = Ysabeau_SC({
  weight: ['500'], // Specify the weights you need
  subsets: ['latin'], // Specify the subsets you need
});

export default function Chat(props) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const fullTextRef = useRef("");
  const isStreamingRef = useRef(false);
  const [waypoints, setWaypoints] = useState(null);
  const streamResponse = async (query, history) => {
    try {
      const response = await fetch('/api/python', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username:props["username"], question: query, chat_history: history}),
      }); 
      const response_json = await response.json();
      const sources = response_json["sources"];
      const answer = response_json["answer"]; 
      let wp;
      let text = '';
      try {
        const answer_json = JSON.parse(answer);
        wp = answer_json["waypoints"];
        if ("places" in answer_json) {
          const places = answer_json["places"];
          places.forEach((place, index) => {
              text += `${index + 1}. ${place["name"]}: ${place["description"]}.`;
              if (index !== places.length - 1) {
                  text += "\n";
              }
          });
        } else if ("days" in answer_json) {
            const days = answer_json["days"];
            days.forEach(day => {
                text += `Day ${day["day"]}:\n`;
                day["activities"].forEach(activity => {
                    text += `- ${activity["time"]}: ${activity["activity"]}\n`;
                });
                text += "\n";
            });
            text += answer_json["hashtags"].join(" ");
        } else {
            text += answer;
        }
      } catch (e) {
          // If parsing fails, assume answer is a plain string
          text += answer;
      }

      let fetchedSources;
      if(sources && sources.length > 0){
        fetchedSources = await fetchSourcePosts(sources);
      }
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[newMessages.length - 1].text = text;
        if (fetchedSources) {
          newMessages[newMessages.length - 1].sources = fetchedSources;
        }
        return newMessages;
      });
      setWaypoints(wp);
      setChatHistory((prevChatHistory) => [...prevChatHistory, {role: "assistant", content: answer }]);
    } catch (error) {
      console.error('Streaming error:', error);
    }
  };

  const handleSend = useCallback((userInput) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: userInput, isUser: true },
      { text: "Hang tight! We're double-checking our response to ensure it's accurate and reliable...", isUser: false },
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
    // console.log("Streaming stopped at index:", currentIndex);
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages];
      // Check if the last message is not complete and is not from the user
      if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser) {
        newMessages[newMessages.length - 1].text = newMessages[newMessages.length - 1].text.slice(0, currentIndex); // Update the last message
      }
      return newMessages;
    });
  }, []);
  // useEffect(() => {
  //   console.log("Messages: ", messages);
  // }, [messages]);
  // useEffect(() => {
  //   console.log("is streaming: ", isStreaming);
  // }, [isStreaming]);

  return (
    <div className="flex h-screen p-4">
      <div className="flex flex-col flex-grow">
        <h1 className={`${ysabeauSC.className} mb-2 text-2xl font-bold`}>Aventurier</h1>
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
                {!message.isUser && message.sources && waypoints && <Map waypoints={waypoints}/>}
                {message.isUser ? (
                  message.text
                ) : (
                  index === messages.length - 1 && message.text !== "Hang tight! We're double-checking our response to ensure it's accurate and reliable..."? ( // Check if this is the last message
                    <ChatStream 
                      fullText={message.text} 
                      isStreaming={isStreaming} 
                      onStreamingComplete={handleStreamingComplete} 
                      onStreamingStop={handleStreamingStop} 
                    />
                  ) : (
                    message.text
                  )
                )}
                {!message.isUser && message.sources && (
                  <div className="mt-2">
                    <br></br>
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
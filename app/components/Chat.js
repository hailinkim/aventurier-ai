// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import ChatStream from '@/components/ChatStream';
// import ChatInput from '@/components/ChatInput';

// export default function Chat(props) {
//   const [messages, setMessages] = useState([]);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const isStreamingRef = useRef(false); // Add a ref to track streaming status
//   const fetchText = async (query) => {
//     const response = await fetch('/api/python', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ username:props["username"], question: query }),
//     });
//     // const text = await response.text();
//     // console.log(text);
//     const response_json = await response.json();
//     const place_info = response_json["places"];
//     let text = "";
//     for (let i = 0; i < place_info.length; i++){
//       text += `${i+1}. ` + place_info[i]["name"] + `(${place_info[i]["address"]}): ` + `${place_info[i]["summary"]}.`;
//       if (i !== place_info.length - 1){
//         text += "\n"; 
//       }
//     }
//     setMessages((prevMessages) => {
//       const newMessages = [...prevMessages];
//       newMessages[newMessages.length - 1].text = text; // Update the last message (AI response)
//       return newMessages;
//     });
//     // const reader = response.body.getReader();
//     // const decoder = new TextDecoder('utf-8');
//     // let done = false;
//     // let text = '';

//     // while (!done) {
//     //   const { value, done: readerDone } = await reader.read();
//     //   done = readerDone;
//     //   text += decoder.decode(value, { stream: true });
//     //   setMessages((prevMessages) => {
//     //     const newMessages = [...prevMessages];
//     //     newMessages[newMessages.length - 1].text = text; // Update the last message (AI response)
//     //     return newMessages;
//     //   });
//     // }
//     console.log(text);
//   };

//   const handleSend = useCallback((userInput) => {
//     setMessages((prevMessages) => [
//       ...prevMessages,
//       { text: userInput, isUser: true },
//       { text: 'Loading...', isUser: false },
//     ]);
//     setIsStreaming(true);
//     fetchText(userInput);
//   }, []);
  

//   useEffect(() => {
//     console.log(messages);
//   }, [messages]);

//   const handleStop = useCallback(() => {
//     setIsStreaming(false);
//     isStreamingRef.current = false; // Set ref to false to stop streaming
//   }, []);

//   const handleStreamingComplete = useCallback(() => {
//     setIsStreaming(false); // Set streaming to false when done
//   }, []);

//   const handleStreaming = useCallback(() => {
//     setIsStreaming(true); // Set streaming to false when done
//   }, []);

//   const handleStreamingStop = useCallback((currentIndex) => {
//     console.log("Streaming stopped at index:", currentIndex);
//     setMessages((prevMessages) => {
//       const newMessages = [...prevMessages];
//       // Check if the last message is not complete and is not from the user
//       if (newMessages.length > 0 && !newMessages[newMessages.length - 1].isUser) {
//         newMessages[newMessages.length - 1].text = newMessages[newMessages.length - 1].text.slice(0, currentIndex); // Update the last message
//       }
//       return newMessages;
//     });
//   }, []);

//   useEffect(() => {
//     console.log(isStreaming);
//   }, [isStreaming]);


//   return (
//     <div className="flex flex-col h-screen p-4">
//       <h1 className="mb-4 text-2xl font-bold">Chatbot Streaming Example</h1>
//       <div className="flex-grow">
//         <div className="flex flex-col border border-gray-300 p-4 rounded-lg h-full overflow-y-auto">
//         {messages.map((message, index) => (
//           <div
//             key={index}
//             className={`my-2 p-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
//               message.isUser
//                 ? 'bg-blue-500 text-white self-end'
//                 : 'bg-gray-100 text-black self-start'
//             }`}
//           >
//             {message.isUser ? (
//               message.text
//             ) : (
//               index === messages.length - 1 && message.text !== "Loading..."? ( // Check if this is the last message
//                 <ChatStream 
//                   fullText={message.text} 
//                   isStreaming={isStreaming} 
//                   onStreamingComplete={handleStreamingComplete} 
//                   onStreamingStop={handleStreamingStop} 
//                 />
//               ) : (
//                 message.text
//               )
//             )}
//           </div>
//         ))}
//         </div>
//       </div>
//       <ChatInput onSend={handleSend} onStop={handleStop} isStreaming={isStreaming}/>
//     </div>
//   );
// }
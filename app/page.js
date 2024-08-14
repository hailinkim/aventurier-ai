'use client';

// import Fast from './components/Fast';
import LoginForm from '@/components/LoginForm';
// import ChatComponent from '@/components/Test2';
export default function Home() {
  return (
    // <Fast/>
    // <ChatComponent/>
      <LoginForm/>
  );
}

// "use client";

// import { useChat } from "ai/react";

// export default function Home() {
//   const { messages, input, handleInputChange, handleSubmit } = useChat({
//     api: "/api/python",
//     body: { username: "celine__lover" },
//   });
//   console.log(messages);

//   return (
//     <main className="flex min-h-screen flex-col items-center justify-between p-24">
//       <div>
//         {messages.map((m) => (
//           <div key={m.id}>
//             {m.role === "user" ? "User: " : "AI: "}
//             {m.content}
//           </div>
//         ))}

//         <form onSubmit={handleSubmit}>
//           <label>
//             Say something...
//             <input value={input} onChange={handleInputChange} />
//           </label>
//           <button type="submit">Send</button>
//         </form>
//       </div>
//     </main>
//   );
// }
// import { useCompletion } from "ai/react";
// import { set } from 'mongoose';

// export default function Home() {
//   const { input, completion, handleInputChange, handleSubmit, isLoading } = useCompletion({
//     api: "/api/python",
//     streamProtocol: 'text',
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: { username: "celine__lover" },
//   });
//   return (
//     <div>
//       <form onSubmit={handleSubmit}>
//         <label htmlFor="ask-input">Ask something:</label>
//         <input id="ask-input" type="text" value={input} onChange={handleInputChange} />
//         <button type="submit">POST</button>
//       </form>
//       <div>{completion}</div>
//     </div>
//   );
// }
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";

const App = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const formatResponse = (text) => {
    return marked.parse(text.trim()); // Markdown to HTML
  };

  const getAiGemini = async (userMessage) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyASlFqjAblPv19ztBzz24opDItBVfExsCo`,
        {
          contents: [{ parts: [{ text: userMessage }] }]
        }
      );

      const aiRawResponse =
        response.data.candidates[0]?.content?.parts[0]?.text ||
        "No response from AI.";

      const aiResponse = formatResponse(aiRawResponse);

      setChatHistory((prevHistory) => [
        ...prevHistory,
        { from: "ai", text: aiResponse }
      ]);
    } catch (error) {
      console.error(error);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          from: "ai",
          text: "<p>Oops, terjadi kesalahan saat menghubungi AI!</p>"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    setChatHistory((prevHistory) => [
      ...prevHistory,
      { from: "user", text: message }
    ]);

    getAiGemini(message);
    setMessage("");
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }

    // Tambahkan tombol Copy di setiap code block
    const codeBlocks = chatContainerRef.current?.querySelectorAll("pre");

    codeBlocks?.forEach((block) => {
      // Kalau belum ada tombol copy, tambahkan
      if (!block.querySelector(".copy-button")) {
        const button = document.createElement("button");
        button.textContent = "Copy";
        button.className =
          "copy-button absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 text-sm rounded shadow hover:bg-blue-700 transition";
        button.onclick = () => {
          const code = block.querySelector("code");
          const text = code ? code.innerText : block.innerText;
          navigator.clipboard.writeText(text).then(() => {
            button.textContent = "Copied!";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 1500);
          });
        };
        block.style.position = "relative";
        block.appendChild(button);
      }
    });
  }, [chatHistory, loading]);

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      <header className="p-4 shadow bg-blue-600 text-white text-center text-2xl font-semibold">
        AI Chatbot
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 prose max-w-none"
        >
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`mb-4 ${
                chat.from === "user" ? "text-right" : "text-left"
              }`}
            >
              {chat.from === "user" ? (
                <p className="inline-block px-4 py-2 rounded-lg bg-blue-500 text-white whitespace-pre-line">
                  {chat.text}
                </p>
              ) : (
                <div
                  className="inline-block px-4 py-2 rounded-lg bg-green-200 text-left w-full"
                  dangerouslySetInnerHTML={{ __html: chat.text }}
                />
              )}
            </div>
          ))}

          {loading && (
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full border-t-4 border-blue-600 w-8 h-8 mx-auto"></div>
              <p>Loading...</p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-300 flex gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </main>

      <style>{`
        pre {
          background: #1e293b;
          color: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow: auto;
          position: relative;
        }
        code {
          white-space: pre-wrap;
          word-wrap: break-word;
          user-select: text;
        }
        ul, ol {
          margin-left: 1.5rem;
          padding-left: 1rem;
        }
        ul {
          list-style-type: disc;
        }
        ol {
          list-style-type: decimal;
        }
        li {
          margin: 0.25rem 0;
        }
      `}</style>
    </div>
  );
};

export default App;

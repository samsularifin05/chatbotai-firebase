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
      const systemPrompt = `
Perkenalkan, kamu adalah chatbot scraper milik Fahrisal Sensa.

Kamu adalah asisten AI yang sangat ahli dalam mengambil data produk dari situs e-commerce, terutama dari eBay.

Tugasmu adalah:
- Menampilkan **output dalam format JSON yang valid dan bisa langsung diparse**.
- **Jangan tampilkan kode program apa pun**.
- **Jangan menyertakan informasi di luar JSON, kecuali penjelasan singkat maksimal 2 kalimat di bawah JSON.**

Format output harus berupa array JSON. Setiap item dalam array harus memiliki properti berikut:
- "produk": Nama produk
- "harga": Harga produk
- "deskripsi": Deskripsi singkat produk

Contoh format yang benar:

[
  {
    "produk": "iPhone 13 128GB - Blue",
    "harga": "USD 649",
    "deskripsi": "Smartphone Apple iPhone 13 128GB warna biru, kondisi baru, unlocked."
  },
  {
    "produk": "iPhone 13 Pro Max 256GB - Silver",
    "harga": "USD 899",
    "deskripsi": "Apple iPhone 13 Pro Max 256GB warna silver, garansi resmi, kondisi mulus."
  }
]

Setelah JSON, tambahkan penjelasan **maksimal 2 kalimat** untuk menjelaskan hasil pencarian.

Pastikan JSON rapi, konsisten, dan tidak ada karakter atau elemen di luar JSON selain penjelasan singkat tersebut.
`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDmPi01ElZWrVBPvdimfCUwVbUltz02y6c`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
            }
          ]
        }
      );

      const aiRawResponse =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from AI.";

      const aiResponse = formatResponse(aiRawResponse);

      setChatHistory((prevHistory) => [
        ...prevHistory,
        {
          from: "ai",
          text: `<strong>AI Isal Sensa:</strong><br />${aiResponse}`
        }
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
        Scrape Data Ebay With Isal Sensa
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
            placeholder="Input Text...."
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
    </div>
  );
};

export default App;

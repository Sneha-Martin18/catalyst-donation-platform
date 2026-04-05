import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "./ChatBot.css";

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your Catalyst Assistant. How can I help you today?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (messageText) => {
        const text = messageText || input;
        if (!text.trim()) return;

        // Add user message
        setMessages((prev) => [...prev, { text, isBot: false }]);
        setInput("");
        setLoading(true);

        try {
            const response = await api.post("chatbot/query/", { message: text });

            setMessages((prev) => [
                ...prev,
                {
                    text: response.data.message,
                    isBot: true,
                    options: response.data.options
                }
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { text: "Sorry, I'm having trouble connecting to the server.", isBot: true }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = (option) => {
        if (option.type === "navigate") {
            navigate(option.path);
            setIsOpen(false);
        } else {
            handleSend(option.value || option.label);
        }
    };

    return (
        <div className="chatbot-wrapper">
            {/* TOGGLE BUTTON */}
            <button
                className={`chatbot-toggle ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Catalyst Assistant"
            >
                {isOpen ? "✕" : "💬"}
            </button>

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="bot-info">
                            <span className="bot-avatar">🤖</span>
                            <div>
                                <h4>Catalyst AI</h4>
                                <p>Assistant • Active</p>
                            </div>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-group ${msg.isBot ? "bot" : "user"}`}>
                                <div className="message-bubble">
                                    {msg.text}
                                </div>
                                {msg.isBot && msg.options && (
                                    <div className="message-options">
                                        {msg.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                className="option-btn"
                                                onClick={() => handleOptionClick(opt)}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="message-group bot">
                                <div className="message-bubble typing">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatBot;

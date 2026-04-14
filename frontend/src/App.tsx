import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import ChatWindow from './components/ChatWindow'
import MessageInput from './components/MessageInput'
import './index.css'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

const conversationId = uuidv4()

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const userMessage: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await axios.post('https://mcp-ecommerce-agent.azurewebsites.net/chat', {
        message: text,
        conversationId
      })
      const assistantMessage: Message = { role: 'assistant', content: res.data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el agente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="chat-header">
        <div className="header-avatar">A</div>
        <div>
          <h1>Arturo</h1>
          <span>Asistente de ventas</span>
        </div>
      </header>
      <ChatWindow messages={messages} loading={loading} bottomRef={bottomRef} />
      <MessageInput onSend={sendMessage} loading={loading} />
    </div>
  )
}

export default App
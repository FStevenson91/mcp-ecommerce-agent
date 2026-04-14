import { type RefObject } from 'react'
import type { Message } from '../App'

interface Props {
  messages: Message[]
  loading: boolean
  bottomRef: RefObject<HTMLDivElement | null>
}

function ChatWindow({ messages, loading, bottomRef }: Props) {
  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="empty-state">
          <p>👋 Hola, soy Arturo. ¿En qué te puedo ayudar hoy?</p>
        </div>
      )}
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <div className="bubble">{msg.content}</div>
        </div>
      ))}
      {loading && (
        <div className="message assistant">
          <div className="bubble typing">
            <span /><span /><span />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default ChatWindow
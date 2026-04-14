import { useState, type KeyboardEvent } from 'react'

interface Props {
  onSend: (text: string) => void
  loading: boolean
}

function MessageInput({ onSend, loading }: Props) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim() || loading) return
    onSend(text.trim())
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="input-container">
      <input
        type="text"
        placeholder="Escribe un mensaje..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button onClick={handleSend} disabled={loading || !text.trim()}>
        Enviar
      </button>
    </div>
  )
}

export default MessageInput
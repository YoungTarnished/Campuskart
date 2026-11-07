import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader } from '../components/ui'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'
import { when } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export default function MessagesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const socket = useSocket()
  const toast = useToast()
  const [conversations, setConversations] = useState([])
  const [thread, setThread] = useState(null)
  const [body, setBody] = useState('')

  function loadList() {
    api('/api/conversations').then((res) => setConversations(res.data)).catch((err) => toast(err.message, 'error'))
  }
  function loadThread(conversationId) {
    api(`/api/conversations/${conversationId}/messages`).then((res) => setThread(res.data)).catch((err) => toast(err.message, 'error'))
  }
  useEffect(() => { loadList() }, [])
  useEffect(() => { if (id) loadThread(id) }, [id])
  useEffect(() => {
    if (!socket || !id) return undefined
    socket.emit('conversation:join', id)
    const onMessage = (message) => {
      if (String(message.conversation) !== String(id)) return
      setThread((current) => {
        if (!current) return current
        if (current.messages.some((item) => item._id === message._id)) return current
        return { ...current, messages: [...current.messages, message] }
      })
      loadList()
    }
    socket.on('message:new', onMessage)
    return () => socket.off('message:new', onMessage)
  }, [socket, id])

  async function send(event) {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    try {
      const res = await api(`/api/conversations/${id}/messages`, { method: 'POST', body: { body: text } })
      setBody('')
      setThread((current) => current && current.messages.some((item) => item._id === res.data._id)
        ? current
        : { ...current, messages: [...current.messages, res.data] })
      loadList()
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div>
      <PageHeader title="Messages" subtitle="Only people in a conversation can read it. Email addresses stay off this screen." />
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <aside className="card max-h-[32rem] overflow-auto">
          {conversations.map((conversation) => {
            const other = (conversation.participants || []).find((person) => person._id !== user?._id)
            return (
              <button key={conversation._id} type="button" className={`block w-full border-b border-slate-100 px-4 py-3 text-left ${conversation._id === id ? 'bg-indigo-50' : ''}`} onClick={() => navigate(`/messages/${conversation._id}`)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{other?.name || 'Student'}</span>
                  {conversation.unread > 0 && <span className="rounded-full bg-indigo-600 px-2 text-xs text-white">{conversation.unread}</span>}
                </span>
                <span className="line-clamp-1 text-xs text-slate-500">{conversation.lastMessage || 'No messages yet'}</span>
              </button>
            )
          })}
          {conversations.length === 0 && <p className="p-4 text-sm text-slate-500">Contact a seller from a product to start a chat.</p>}
        </aside>
        <section className="card flex min-h-[24rem] flex-col">
          {!thread ? <p className="p-6 text-sm text-slate-500">Choose a conversation.</p> : (
            <>
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
                {thread.conversation.product ? <Link to={`/products/${thread.conversation.product._id}`}>{thread.conversation.product.title}</Link> : 'Direct message'}
              </div>
              <div className="flex-1 space-y-3 overflow-auto p-4">
                {thread.messages.map((message) => {
                  const mine = (message.sender?._id || message.sender) === user?._id
                  return (
                    <div key={message._id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'ml-auto bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                      <p>{message.body}</p>
                      <p className={`mt-1 text-[11px] ${mine ? 'text-indigo-100' : 'text-slate-500'}`}>{when(message.createdAt)} {mine ? (message.read ? '· Read' : '· Sent') : ''}</p>
                    </div>
                  )
                })}
              </div>
              <form className="flex gap-2 border-t border-slate-100 p-3" onSubmit={send}>
                <input className="field" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message" />
                <button className="btn-primary" type="submit">Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

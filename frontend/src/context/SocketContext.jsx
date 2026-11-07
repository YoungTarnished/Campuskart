import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('campuskart_token')
    const client = io(import.meta.env.VITE_API_URL || undefined, { auth: { token } })
    setSocket(client)
    return () => client.disconnect()
  }, [user?._id])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}

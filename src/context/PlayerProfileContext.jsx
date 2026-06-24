import { createContext, useContext, useState, useCallback } from 'react'
import PlayerProfile from '../components/PlayerProfile'

const PlayerProfileContext = createContext(null)

export function PlayerProfileProvider({ children }) {
  const [playerId, setPlayerId] = useState(null)

  const openPlayerProfile = useCallback((id) => {
    if (id) setPlayerId(id)
  }, [])

  const closePlayerProfile = useCallback(() => {
    setPlayerId(null)
  }, [])

  return (
    <PlayerProfileContext.Provider value={{ openPlayerProfile, closePlayerProfile }}>
      {children}
      {playerId && (
        <PlayerProfile playerId={playerId} onClose={closePlayerProfile} />
      )}
    </PlayerProfileContext.Provider>
  )
}

export function usePlayerProfile() {
  const ctx = useContext(PlayerProfileContext)
  if (!ctx) {
    throw new Error('usePlayerProfile must be used within PlayerProfileProvider')
  }
  return ctx
}

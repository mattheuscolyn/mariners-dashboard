import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PlayerProfileProvider } from './context/PlayerProfileContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import Glossary from './pages/Glossary'
import './App.css'

function App() {
  return (
    <BrowserRouter basename="/mariners-dashboard">
      <PlayerProfileProvider>
        <Nav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/glossary" element={<Glossary />} />
          </Routes>
        </main>
        <Footer />
      </PlayerProfileProvider>
    </BrowserRouter>
  )
}

export default App

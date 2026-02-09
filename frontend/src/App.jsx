import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import ClaimPage from './pages/ClaimPage'
import HistoryPage from './pages/HistoryPage'
import ReceivePage from './pages/ReceivePage'
import { WalletProvider } from './context/WalletContext'

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-dark-950">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/claim/:token" element={<ClaimPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/receive" element={<ReceivePage />} />
        </Routes>
      </div>
    </WalletProvider>
  )
}

export default App

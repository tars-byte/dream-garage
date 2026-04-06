import { BrowserRouter, Routes, Route } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import CatalogPage from './pages/CatalogPage'
import GaragePreviewPage from './pages/GaragePreviewPage'
import SharePage from './pages/SharePage'
import GaragePublicPage from './pages/GaragePublicPage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/admin/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/build" element={<CatalogPage />} />
        <Route path="/garage" element={<GaragePreviewPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/g/:id" element={<GaragePublicPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

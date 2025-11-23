import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WanVideoPage from './pages/WanVideoPage'
import NonoBananaPage from './pages/NonoBananaPage'
import QwenPage from './pages/QwenPage'
import CommunityPromptsPage from './pages/CommunityPromptsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/wan-video" element={<WanVideoPage />} />
        <Route path="/nono-banana" element={<NonoBananaPage />} />
        <Route path="/qwen" element={<QwenPage />} />
        <Route path="/community-prompts" element={<CommunityPromptsPage />} />
      </Routes>
    </Router>
  )
}

export default App
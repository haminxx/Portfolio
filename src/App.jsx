import { Routes, Route } from 'react-router-dom'
import LandingWrapper from './components/LandingWrapper'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
    </Routes>
  )
}

export default App

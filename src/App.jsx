import { Routes, Route } from 'react-router-dom'
import PreLanding from './pages/PreLanding'
import ChromeLanding from './pages/ChromeLanding'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PreLanding />} />
      <Route path="/home" element={<ChromeLanding />} />
    </Routes>
  )
}

export default App

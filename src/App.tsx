import { FunctionComponent } from 'react'
import './App.css'
import { Box } from '@mui/material'
import ScrollToTopButton from './components/ScrollToTopButton'
import ButtonAppBar from './components/ButtonAppBar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dance from './pages/Dance'
import Music from './pages/Music'
import Search from './pages/Search'


const App: FunctionComponent = () => {

  return (
    <Box
      height={'100vh'}
      bgcolor={'background.default'}
      mb={"80px"}

    >
      <ButtonAppBar />
      <Box mt={"16px"} mb={"64px"} textAlign={'center'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dance/:slug" element={<Dance />} />
          <Route path="/music/:slug" element={<Music />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </Box>
      <ScrollToTopButton />
    </Box>
  )
}


export default App

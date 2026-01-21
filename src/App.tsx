import { FunctionComponent, lazy, Suspense } from 'react'
import './App.css'
import { Box, CircularProgress } from '@mui/material'
import ScrollToTopButton from './components/ScrollToTopButton'
import ButtonAppBar from './components/ButtonAppBar'
import OfflineStatus from './components/OfflineStatus'
import { Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Dance = lazy(() => import('./pages/Dance'))
const Music = lazy(() => import('./pages/Music'))
const Search = lazy(() => import('./pages/Search'))

const App: FunctionComponent = () => {

  return (
    <Box
      height={'100vh'}
      bgcolor={'background.default'}
      mb={"80px"}

    >
      <ButtonAppBar />
      <Box mt={"16px"} mb={"64px"} textAlign={'center'}>
        <Suspense fallback={<CircularProgress sx={{ mt: 4 }} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dance/:slug" element={<Dance />} />
            <Route path="/music/:slug" element={<Music />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </Suspense>
      </Box>
      <ScrollToTopButton />
      <OfflineStatus />
    </Box>
  )
}


export default App

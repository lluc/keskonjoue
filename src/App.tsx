import { FunctionComponent } from 'react'
import './App.css'
import { Box, Typography } from '@mui/material'
import ScrollToTopButton from './components/ScrollToTopButton'
import ButtonAppBar from './components/ButtonAppBar'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

const App: FunctionComponent = () => {

  return (
    <Box
      height={'100vh'}
      bgcolor={'background.default'}
      mb={"80px"}

    >
      <ButtonAppBar />
      <Box mt={"64px"} mb={"64px"} textAlign={'center'}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Box>
      <ScrollToTopButton />
    </Box>
  )
}


export default App

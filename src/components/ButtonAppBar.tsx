import { FunctionComponent, useState } from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { Share, Search, Info } from '@mui/icons-material';
import AboutDialog from './AboutDialog';

const ButtonAppBar: FunctionComponent = () => {
    const navigateTo = useNavigate()
    const [aboutOpen, setAboutOpen] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title: 'Keskonjoue',
            text: 'Keskonjoue',
            url: window.location.href,
        }

        if (navigator?.share) {
            try {
                await navigator.share(shareData);
                console.log('Thanks for sharing!');
            } catch (err) {
                console.error(err);
            }
        } else {
            console.log("No sharing supported");
        }
    };

    const handleSearch = () => {
        navigateTo('/search')
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{ mr: 2 }}
                        onClick={() => { navigateTo('/') }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
                        Keskonjoue
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="search"
                        onClick={() => { handleSearch() }}
                    >
                        <Search />
                    </IconButton>
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="share"
                        onClick={() => { handleShare() }}
                    >
                        <Share />
                    </IconButton>
                    <IconButton
                        size="large"
                        edge="end"
                        color="inherit"
                        aria-label="about"
                        onClick={() => setAboutOpen(true)}
                    >
                        <Info />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
        </Box>
    );
}

export default ButtonAppBar

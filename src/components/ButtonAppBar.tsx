import { FunctionComponent } from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { Share } from '@mui/icons-material';

const ButtonAppBar: FunctionComponent = () => {
    const navigateTo = useNavigate()

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
                        aria-label="share"
                        onClick={() => { handleShare() }}
                    >
                        <Share />
                    </IconButton>
                   
                </Toolbar>
            </AppBar>
        </Box>
    );
}

export default ButtonAppBar

import { FunctionComponent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { APP_INFO } from '../config/version';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const AboutDialog: FunctionComponent<AboutDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>À propos de {APP_INFO.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Version {APP_INFO.version}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {APP_INFO.description}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Application développée grâce aux contributions des membres des associations :
        </Typography>
        <List dense disablePadding component="ul" sx={{ listStyleType: 'disc', pl: 3 }}>
          <ListItem disableGutters sx={{ display: 'list-item' }}>
            <ListItemText primary="P'tit Louis Laplanche (Vendôme - 41, France)" />
          </ListItem>
          <ListItem disableGutters sx={{ display: 'list-item' }}>
            <ListItemText primary="L'arentèle (Montoire-sur-le-Loir - 41, France)" />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog;

import { FunctionComponent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog;

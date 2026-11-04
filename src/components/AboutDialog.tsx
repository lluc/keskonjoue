import { FunctionComponent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { APP_INFO } from '../config/version';
import { CHANGELOG } from '../config/changelog';

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
          Nouveautés
        </Typography>
        {CHANGELOG.slice(0, 3).map((entry) => (
          <div key={entry.version}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
              Version {entry.version}
            </Typography>
            <List dense disablePadding component="ul" sx={{ listStyleType: 'disc', pl: 3 }}>
              {entry.items.map((item) => (
                <ListItem key={item} disableGutters sx={{ display: 'list-item' }}>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </div>
        ))}

        <Divider sx={{ mt: 2 }} />

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
          <GroupsIcon fontSize="small" color="action" />
          <Typography variant="body1">
            Application développée grâce aux contributions des membres des associations :
          </Typography>
        </Stack>
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

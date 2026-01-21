import { FunctionComponent, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useServiceWorker } from '../hooks/useServiceWorker';

const OfflineStatus: FunctionComponent = () => {
  const status = useServiceWorker();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === 'installing') {
      setOpen(true);
      setDismissed(false);
    } else if (status === 'ready' && !dismissed) {
      setOpen(true);
    }
  }, [status, dismissed]);

  const handleClose = () => {
    setOpen(false);
    if (status === 'ready') {
      setDismissed(true);
    }
  };

  const getMessage = (): string | null => {
    if (status === 'installing') {
      return 'Téléchargement pour le mode hors-ligne...';
    }
    if (status === 'ready' && !dismissed) {
      return 'Application prête pour le mode hors-ligne';
    }
    return null;
  };

  const message = getMessage();

  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={status === 'ready' ? 4000 : null}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={status === 'ready' ? 'success' : 'info'}
        variant="filled"
        onClose={handleClose}
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default OfflineStatus;

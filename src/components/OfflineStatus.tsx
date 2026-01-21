import { FunctionComponent } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useServiceWorker, ServiceWorkerStatus } from '../hooks/useServiceWorker';

const OfflineStatus: FunctionComponent = () => {
  const status = useServiceWorker();

  const getMessage = (status: ServiceWorkerStatus): string | null => {
    switch (status) {
      case 'installing':
        return 'Téléchargement pour le mode hors-ligne...';
      case 'ready':
        return 'Application prête pour le mode hors-ligne';
      default:
        return null;
    }
  };

  const message = getMessage(status);

  if (!message) return null;

  return (
    <Snackbar
      open={true}
      autoHideDuration={status === 'ready' ? 4000 : null}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={status === 'ready' ? 'success' : 'info'}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default OfflineStatus;

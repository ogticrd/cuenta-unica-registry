import { LoggingBunyan } from '@google-cloud/logging-bunyan';
import bunyan from 'bunyan';

const loggingBunyan = new LoggingBunyan();

const logger = bunyan.createLogger({
  name: 'auth-registry',
  streams: [
    { stream: process.stdout, level: 'info' },
    loggingBunyan.stream('info'),
  ],
});

export default logger;

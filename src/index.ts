import { Server } from './server';

const DEFAULT_PORT = 3001;

const PORT = (process.env.PORT) ? parseInt(process.env.PORT) : DEFAULT_PORT;

const server = new Server();
server.listen(PORT);
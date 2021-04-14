// TODO: Use environment variable
const PORT = 3000;

import { Server } from './server';

const server = new Server();
server.listen(PORT);
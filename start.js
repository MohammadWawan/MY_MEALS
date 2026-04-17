process.env.HOSTNAME = '10.48.3.2';
process.env.PORT = '3003';
console.log(`Starting standalone server at http://${process.env.HOSTNAME}:${process.env.PORT}`);
require('./.next/standalone/server.js');

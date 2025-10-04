const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server Working</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ Server is Working on Port 8080!</h1>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p><a href="http://localhost:8080">Refresh</a></p>
      </body>
    </html>
  `);
});

server.listen(8080, 'localhost', () => {
  console.log('✅ Test server running on http://localhost:8080');
  console.log('✅ Server is listening and ready!');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
});
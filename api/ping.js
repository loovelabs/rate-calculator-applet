// Simple JavaScript endpoint (no TypeScript) to test runtime
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Pong!',
    timestamp: new Date().toISOString(),
    method: req.method,
    nodeVersion: process.version
  });
};

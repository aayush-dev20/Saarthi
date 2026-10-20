export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Sanitized logging
  console.error(`❌ [API Error] ${req.method} ${req.url} - Status ${statusCode}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const sanitizedUrl = req.originalUrl.split('?')[0];
    console.log(`📡 [${req.method}] ${sanitizedUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
}

router.get('/verify-token', authenticateJWT, (req, res) => {
    res.json({ valid: true });
  });
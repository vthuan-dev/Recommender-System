const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

// Route bắt đầu OAuth flow
router.get("/api/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"],
  prompt: 'select_account'
}));

// Route callback
router.get("/api/auth/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` 
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        throw new Error("Authentication failed");
      }

      const token = jwt.sign(
        { 
          userId: req.user.id,
          role: req.user.role_name || 'customer'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'google-auth-success',
              token: '${token}',
              user: {
                id: ${req.user.id},
                fullname: '${req.user.fullname}',
                email: '${req.user.email}',
                role_name: '${req.user.role_name || 'customer'}',
                avatar_url: '${req.user.avatar_url || ''}'
              }
            }, '${process.env.FRONTEND_URL}');
            window.close();
          }
        </script>
      `);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }
);

module.exports = router;

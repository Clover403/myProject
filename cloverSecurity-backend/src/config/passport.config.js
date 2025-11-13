const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../../models');
const User = db.User;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({
        where: { googleId: profile.id }
      });

      if (user) {
        // Update last login
        await user.update({ lastLogin: new Date() });
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        locale: profile._json.locale,
        lastLogin: new Date()
      });

      return done(null, user);
    } catch (error) {
      console.error('Passport strategy error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

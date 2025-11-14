const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../../models');
const User = db.User;

console.log('🔐 Initializing Passport Google Strategy...');
console.log('📝 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set ✅' : 'Missing ❌');
console.log('📝 Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌');
console.log('📝 Callback URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('📥 Google OAuth profile received:', {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName
      });

      // Check if user exists
      let user = await User.findOne({
        where: { googleId: profile.id }
      });

      if (user) {
        console.log('✅ Existing user found:', user.email);
        // Update last login
        await user.update({ lastLogin: new Date() });
        return done(null, user);
      }

      // Create new user
      console.log('➕ Creating new user...');
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0]?.value,
        locale: profile._json.locale,
        lastLogin: new Date()
      });

      console.log('✅ New user created:', user.email);
      return done(null, user);
    } catch (error) {
      console.error('❌ Passport strategy error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  console.log('💾 Serializing user:', user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🔍 Deserializing user:', id);
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialize error:', error);
    done(error, null);
  }
});

console.log('✅ Passport configuration complete');

module.exports = passport;
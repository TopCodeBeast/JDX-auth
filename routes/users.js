const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: './uploads' });
const User = require('../models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { check, validationResult } = require('express-validator/check');

passport.serializeUser(async (user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.getUserById(id);
    if (!user) {
      return done(new Error('user not found'));
    }
    done(null, user);
  } catch (e) {
    done(e);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    let user = null;
    try {
      user = await User.getUserByUsername(username);
      if (!user) {
        return done(null, false, {
          message: 'Incorrect username or password.',
        });
      }
    } catch (err) {
      return done(err);
    }

    const isSame = await User.comparePassword(password, user.password);
    if (isSame) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Invalid Password' });
    }
  }),
);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}

//
router.get('/register', async (req, res) => {
  res.render('register', { title: 'Register' });
});

//
router.get('/login', async (req, res) => {
  res.render('login', { title: 'Login' });
});

router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: 'Invalid Credentials',
  }),
  function (req, res) {
    req.flash('success', 'You are now logged in');
    res.redirect('/users/members');
  },
);

router.post(
  '/register',
  upload.single('profile'),
  [
    check('name', 'Name is empty!! Required').not().isEmpty(),
    check('email', 'Email required').not().isEmpty(),
    check('contact', 'contact length should be 10')
      .not()
      .isEmpty()
      .isLength({ max: 10 }),
  ],
  async (req, res, next) => {
    let form = {
      person: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      uname: req.body.username,
      pass: req.body.password,
    };
    const errr = validationResult(req);
    if (!errr.isEmpty()) {
      res.render('register', { errors: errr.errors, form: form });
    } else {
      let name = req.body.name;
      let email = req.body.email;
      let uname = req.body.username;
      let password = req.body.password;
      let contact = req.body.contact;

      let profileimage = req.file ? req.file.filename : 'noimage.jpg';
      let newUser = new User({
        name: name,
        email: email,
        password: password,
        profileimage: profileimage,
        uname: uname,
        contact: contact,
      });
      await User.createUser(newUser);

      res.location('/');
      res.redirect('./login');
    }
  },
);

router.get('/logout', function (req, res) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success', 'You are now logged out');
    res.redirect('/users/login');
  });
});

router.delete('/', async (req, res) => {
  try {
    const member = await User.deleteById(req.body.userId);
    res.json({ success: true, userId: req.body.userId });
  } catch (error) {
    console.error(error);
  }
});

/* GET users listing. */
router.get('/members', ensureAuthenticated, async (req, res) => {
  const members = await User.getUsers();
  res.render('members', { title: 'Members', members });
});

router.get('/update/:id', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.getUserById(req.params.id);
    res.render('update', { title: 'Edit Member', user });
  } catch (error) {
    console.error(error);
  }
});

router.post(
  '/update',
  upload.single('profile'),
  [
    check('name', 'Name is empty!! Required').not().isEmpty(),
    check('email', 'Email required').not().isEmpty(),
    check('contact', 'contact length should be 10'),
    check('username', 'Username is empty')
      .not()
      .isEmpty()
      .isLength({ max: 10 }),
  ],
  ensureAuthenticated, 
  async (req, res, next) => {
    const errr = validationResult(req);
    if (!errr.isEmpty()) {
      res.render('update', { errors: errr.errors, user: req.body });
      return;
    }

    const { uuid, name, email, username, password, contact } = req.body;
    const user = await User.getUserByUuId(uuid);
    if (!user) {
      const errors = [
        { msg: 'User Not Found', param: 'email', localtion: 'body' },
      ];
      res.render('update', { errors, form: req.body });
      return;
    }

    user.name = name;
    user.email = email;
    user.contact = contact;
    user.uname = username;
    user.password = await User.hashPassword(password);
    await user.save();

    res.location('/');
    res.redirect('./members');
  },
);

module.exports = router;

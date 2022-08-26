const express = require('express');
const cookieParser = require('cookie-parser')
const cors = require("cors");
const app = express();
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const db = require('./database')
const bcrypt = require('bcrypt')
const session = require('express-session')
require('dotenv').config();

const port = process.env.PORT || 3001;

const cookieOptions = {
  domain: [process.env.COOKIE_DOMAIN],
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // must be 'none' to enable cross-site delivery
  secure: process.env.NODE_ENV === "production" // must be true if sameSite='none'
}

// Middleware
app.set("trust proxy", 1);
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: [process.env.FRONTEND_APP_URL],
  methods: ["GET", "POST"],
  credentials: true,
  optionsSuccessStatus: 200
}))
app.use(
  session({
    key: "userId",
    secret: process.env.SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: cookieOptions
  })
);

// Routers
app.use('/products', productRoutes)
app.use('/cart', cartRoutes)

// Routes
app.get('/categories', (req, res) =>{    
  db.query('SELECT * FROM categories', (err, result) => {
    res.send(result)
  })
})

app.post('/sign-up', async (req, res) => {

  const email = req.body.formEmail
  const pass = req.body.formPass
  const saltRounds = 10;
  const encryptedPassword = await bcrypt.hash(pass, saltRounds)

  const insert = () => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM accounts WHERE email = ?', [email], () => {       
        db.query('INSERT INTO accounts VALUES (?, ?)', [email, encryptedPassword], (err, result) => {if (err) {
              reject(err)
          } else {
              db.query(`INSERT INTO carts (user_id, subtotal, tax, total) VALUES (?, ?, ?, ?)`, [email, 0, 0, 0])
              resolve(true)
              req.session.user = {email: email, password: encryptedPassword}
          } 
        })
      })
    })
  }
  try {
    res.send(await insert())
  } catch(e) {
      if (e.code =='ER_DUP_ENTRY')
        res.send('Email already used')
      else  
        res.send('Unkown error, try again')
    }
  })

app.post('/login', async (req, res)  => {

  const userEmail = req.body.formEmail
  const pass = req.body.formPass

  try { 
    db.query(`SELECT * FROM accounts WHERE email = '${userEmail}'`, async (err, result) => {
    if (err)
      res.send(err)
    else if (result.length === 0) 
      res.send('Invalid email or password')
    else if (await bcrypt.compare(pass, result[0].password)) {
      req.session.user = result[0]
      res.send(true)
    }
    else
      res.send('Invalid email or password')
  })
  } catch(e) {
    res.send('Catch an error: ' + e)
  }
})

app.get('/logout', (req, res)  => {
  let username = req.session.user.email
  req.session.destroy()
  res.clearCookie('cart', cookieOptions)
  res.send(`Bye ${username}. See you soon!`)
})

app.get('/userInfo', (req, res)  => {
  res.send(req.session ? req.session.user : false)
})

app.get("/orders", async (req, res) => {
  let isLoggedIn = Boolean(req.session.user);
  let userEmail = isLoggedIn ? req.session.user.email : false;

  new Promise((resolve, reject) => {
    db.query(`
      SELECT id, email, subtotal, tax, total, DATE_FORMAT(datetime, '%m-%d-%Y') 
      AS date 
      FROM orders 
      WHERE email ='${userEmail}' 
      ORDER BY datetime DESC`, async (err, result) => {
        let userOrderInfo = result; // All of User's Order Numbers and Info
        let fullOrders = [];

        userOrderInfo.forEach((order) => {
          fullOrders.push({
            orderInfo: {
              id: order.id,
              subtotal: order.subtotal,
              tax: order.tax,
              total: order.total,
              date: order.date,
            },
            orderItems: [],
          });
        });

        db.query(`
          SELECT order_id, products.name, orderitems.price, orderitems.qty
          FROM orderitems  
          INNER JOIN products
          ON orderitems.product_id = products.id
          WHERE email='${userEmail}'`, (err, result) => {
            
            let orderItems = result;

            for (let i = 0; i < orderItems.length; i++) {
              for (let k = 0; k < fullOrders.length; k++) {
                if (orderItems[i].order_id === fullOrders[k].orderInfo.id) {
                  fullOrders[k].orderItems.push(orderItems[i]);
                }
              }
            }
            resolve(fullOrders);
          }
        );
      }
    );
  }).then((fullOrders) => res.send(fullOrders));
});

app.listen(port, () => {
  console.log("Server is running on port " + port);
})


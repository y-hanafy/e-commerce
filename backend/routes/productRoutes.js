const express = require("express")
const app = express()
const router = express.Router()
const db = require("../database")
const cookieParser = require("cookie-parser")
const cors = require("cors")
require('dotenv').config();

const cookieOptions = {
  domain: [process.env.COOKIE_DOMAIN],
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // must be 'none' to enable cross-site delivery
  secure: process.env.NODE_ENV === "production" // must be true if sameSite='none'
}

// Middleware
app.set("trust proxy", 1);
router.use(cookieParser())
router.use(cors({
  origin: [process.env.FRONTEND_APP_URL],
  credentials: true,
  optionsSuccessStatus: 200
}))

// Routes
router.get("/", (req, res) => {
  db.query('SELECT * FROM products', (err, result) => { 
    if (err) 
      res.send(err)
    else 
      res.send(result)
  })
})

router.get("/added", async (req, res) => {

  // Variables
  const productid = parseInt(req.query.product)
  let isLoggedIn = Boolean(req.session.user)

  // Functions
  let getProduct = () => {
    return new Promise((resolve, reject) => { 
      db.query(`SELECT * FROM products WHERE id=${productid}`, (err, result) => {
        resolve(result[0])
      })
    })
  }

  let getCartInfo = (updatedCartItems) => {
    let subtotal = 0
    updatedCartItems.forEach((element) => subtotal += element.qty * element.price)
    subtotal = Number(subtotal.toFixed(2))
    let tax = Number((subtotal * 0.06625).toFixed(2))
    let total = subtotal + tax
    return {subtotal: subtotal, tax: tax, total: total}
  }

  let checkForUserCart = (userEmail)  => {
    return new Promise((resolve, reject) => {
      db.query(`SELECT * FROM carts WHERE user_id='${userEmail}'`, (err, result) => { if (err) reject(err);
        if (result.length < 1) {
          db.query(`INSERT INTO carts (user_id, subtotal, tax, total) VALUES (?, ?, ?, ?)`, [userEmail, 0, 0, 0], (err) => { if (err) reject(err)
            resolve(true)
          })
        }
        resolve(true)
      })
    })
  }

  let addToUserCart = (userEmail) => {
    return new Promise((resolve, reject) => {
      db.query(`
      SELECT qty, products.*
      FROM cartitems 
      INNER JOIN products
      ON product_id = products.id
      WHERE user_id='${userEmail}'`, (err, result) => { if (err) reject(err);

        let currentCartItems = result
        const index = currentCartItems.findIndex((item) => item.id === productid)

        if (index === -1) {
          db.query(`INSERT INTO cartitems (user_id, product_id, qty) VALUES ('${userEmail}', ${productid}, 1)`, async (err) => { if (err) reject(err);
            let product = await getProduct()
            product.qty = 1
            currentCartItems = [...currentCartItems, ...[product]]
            resolve(currentCartItems)
          })
        } 
        else {
          db.query(`UPDATE cartitems SET qty = qty + 1 WHERE product_id=${productid} AND user_id='${userEmail}'`, (err) => { if (err) reject(err);
            currentCartItems[index].qty += 1
            resolve(currentCartItems)
          })
        }
      })
    })
  }

  let updateCartInfo = (cartItems, userEmail) => {
    return new Promise((resolve, reject) => {
      let cartInfo = getCartInfo(cartItems)
      db.query(`UPDATE carts SET subtotal=${cartInfo.subtotal}, tax=${cartInfo.tax}, total=${cartInfo.total} WHERE user_id='${userEmail}'`, (err) => { if (err) reject(err);    
        resolve({cartItems: cartItems, cartInfo: cartInfo})
      })
    })
  }

  // Logic
  if (isLoggedIn) {

    let userEmail = req.session.user.email
    checkForUserCart(userEmail)
      .then(() => addToUserCart(userEmail))
      .then(cartItems => updateCartInfo(cartItems, userEmail))
      .then(cart => {
        res.cookie('cart', cart, cookieOptions)
        res.send(cart)
      })

  } else {

      let product = await getProduct()
      let currentCartItems = req.cookies['cart'] ? req.cookies['cart'].cartItems : []

      let cartInfo = req.cookies['cart'] ? req.cookies['cart'].cartInfo : {}
      const index = currentCartItems.findIndex((product) => product.id === productid)
      index === -1 ? (product.qty = 1, currentCartItems = [...currentCartItems, ...[product]]) : currentCartItems[index].qty += 1
      
      cartInfo = getCartInfo(currentCartItems)
      let cart = {cartItems: currentCartItems, cartInfo: cartInfo}

      res.cookie('cart', cart, cookieOptions)      
      res.send(cart)
  }
})

module.exports = router
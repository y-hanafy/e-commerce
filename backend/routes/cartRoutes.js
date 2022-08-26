const express = require("express");
const app = express();
const router = express.Router();
const db = require("../database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require('dotenv').config();

const cookieOptions = {
  domain: [process.env.COOKIE_DOMAIN],
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // must be 'none' to enable cross-site delivery
  secure: process.env.NODE_ENV === "production" // must be true if sameSite='none'
}

// Middleware
app.set("trust proxy", 1);
router.use(cookieParser());
router.use(
  cors({
    origin: [process.env.FRONTEND_APP_URL],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

//Functions
const getCartItems = (userEmail) => {
  return new Promise((resolve, reject) => {
    db.query(
      `
        SELECT products.id, name, image, price, qty
        FROM cartitems 
        INNER JOIN products
        ON cartitems.product_id = products.id
        WHERE cartitems.user_id='${userEmail}'`,
      (err, response) => {
        if (err) reject(err);
        resolve(response);
      }
    );
  });
};

const getCartInfo = (cartItems) => {
  let subtotal = 0;
  cartItems.forEach((element) => (subtotal += element.qty * element.price));
  subtotal = Number(subtotal.toFixed(2));
  let tax = Number((subtotal * 0.06625).toFixed(2));
  let total = subtotal + tax;
  return { subtotal: subtotal, tax: tax, total: total };
};

// Routes
router.get("/", (req, res) => {
  let isLoggedIn = Boolean(req.session.user);

  if (isLoggedIn) {
    let userEmail = req.session.user.email;
    getCartItems(userEmail)
      .then(() => getCartItems(userEmail))
      .then((cartItems) => ({
        cartItems: cartItems,
        cartInfo: getCartInfo(cartItems),
      }))
      .then((cart) => {
        cart.cartItems.length > 0 &&
          res.cookie("cart", cart, cookieOptions);
        res.send(cart);
      })
      .catch((err) => "Error getting cart, Error: " + err);
  } else res.send(req.cookies["cart"] ? req.cookies["cart"] : false);
});

router.get("/update", (req, res) => {
  
  // Variables
  let isLoggedIn = Boolean(req.session.user);
  let userEmail = isLoggedIn ? req.session.user.email : false;
  const productid = parseInt(req.query.product);
  const buttonid = req.query.button;
  let cart = req.cookies["cart"];
  let cartItems = cart.cartItems;
  let index = cartItems.findIndex((product) => product.id === productid);

  // Functions
  const updateCart = () => {
    return new Promise((resolve, reject) => {
      if (!isLoggedIn) {
        switch (buttonid) {
          case "add":
            cartItems[index].qty += 1;
            break;
          case "subtract":
            cartItems[index].qty > 1 && (cartItems[index].qty -= 1);
            break;
          case "remove":
            cartItems.splice(index, 1);
        }
        cart.cartInfo = getCartInfo(cartItems);
        reject("updated cart cookie");
      } else {
        switch (buttonid) {
          case "add":
            db.query(
              `UPDATE cartitems SET qty = qty + 1 WHERE user_id='${userEmail}' AND product_id=${productid}`, (err) => {
                if (err) { reject(err); }
                resolve(true);
              }
            );
            break;
          case "subtract":
            db.query(
              `UPDATE cartitems SET qty = qty - 1 WHERE user_id='${userEmail}' AND product_id=${productid} AND qty > 1`, (err) => {
                if (err) { reject(err); }
                resolve(true);
              }
            );
            break;
          case "remove":
            db.query(
              `DELETE FROM cartitems WHERE user_id='${userEmail}' AND product_id=${productid}`, (err) => {
                if (err) { reject(err); }
                resolve(true);
              }
            );
        }
      }
    });
  };

  const updateDB = (cart) => {
    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE carts SET subtotal=${cart.cartInfo.subtotal}, tax=${cart.cartInfo.tax}, total=${cart.cartInfo.total} WHERE user_id='${userEmail}'`,
        (err) => {
          if (err) reject(err);
          resolve(cart);
        }
      );
    });
  };

  // Logic
  updateCart()
    .then(() => getCartItems(userEmail))
    .then((cartItems) => ({
      cartItems: cartItems,
      cartInfo: getCartInfo(cartItems),
    }))
    .then(async (cart1) => (cart = await updateDB(cart1)))
    .catch((err) => console.log(err))
    .finally(() => {
      res.cookie("cart", cart, cookieOptions);
      res.send(cart);
    });
});
    
router.get("/placed", (req, res) => {
  let isLoggedIn = Boolean(req.session.user);
  let userEmail = isLoggedIn ? req.session.user.email : false;
  const cart = req.cookies["cart"];
  const cartInfo = req.cookies["cart"].cartInfo;
  const cartItems = req.cookies["cart"].cartItems;
  let randomNumber = Math.floor(Math.random() * 10000000 + 1);
  const cartItemValues = cartItems.map((item) => [
    randomNumber,
    item.id,
    item.price,
    item.qty,
  ]);

  if (isLoggedIn) {
    return new Promise((resolve, reject) => {
      db.query(`
        INSERT INTO orders
        SELECT ${randomNumber}, '${userEmail}', subtotal, tax, total, NOW()
        FROM carts
        WHERE user_id='${userEmail}'`, (err) => {
          if (err)
            reject(err);
          resolve(true);
      })        
    }).then(() => {
      return new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO orderitems (order_id, email, product_id, price, qty)
          SELECT ${randomNumber}, '${userEmail}', product_id, price, qty
          FROM cartitems
          INNER JOIN products
          ON cartitems.product_id = products.id
          WHERE user_id='${userEmail}'`, (err) => {
            if (err)
              reject(err);
            resolve(true);
        })          
      })
    }).then(() => {
      return new Promise((resolve, reject) => {
        db.query(`DELETE FROM cartitems WHERE user_id='${userEmail}'`, (err) => {
          if (err)
            reject(err);
          resolve(true);
        })
      })
    }).then(() => {
      return new Promise((resolve, reject) => {
        db.query(`UPDATE carts SET subtotal=0, tax=0, total=0 WHERE user_id='${userEmail}'`, (err) => {
          if (err)
            reject(err);
          resolve(true);
        })
      })
    }).then(res.clearCookie("cart", cookieOptions).send({ cart: cart, orderNumber: randomNumber })
    ).catch((err) => console.log(err))

  } else {
    return new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO orders (id, subtotal, tax, total, datetime) VALUES (${randomNumber}, ${cartInfo.subtotal}, ${cartInfo.tax}, ${cartInfo.total}, NOW())`, (err) => {
          if (err)
            reject(err);
          resolve(true)
        }
      )
    }).then(() => {
      return new Promise((resolve, reject) => {
        db.query(
        `INSERT INTO orderitems (order_id, product_id, price, qty) VALUES ?`, [cartItemValues], (err) => {
          if (err)
            reject(err);
          resolve(true)
        })
      })
    }).then(() => res.clearCookie("cart", cookieOptions).send({ cart: cart, orderNumber: randomNumber }))
  }
})

module.exports = router;

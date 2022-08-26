import { Button, Container, Col, Card, Row } from 'react-bootstrap'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'

export default function CartItems() {
  
  axios.defaults.withCredentials = true

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT
  const [cartItems, setCartItems] = useState([])
  const [cartInfo, setCartInfo] = useState({})
  const [isLoading, setIsLoading] = useState(true)  
  const [updatingCart, setUpdatingCart] = useState(false)

  let navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API_ENDPOINT}/cart`).then((response) => { 
      if (response.data) {
        setCartItems(response.data.cartItems)
        setCartInfo(response.data.cartInfo)
      }
      setIsLoading(false)
    })
  }, [])

  const update = (productid, buttonid) => {
    setUpdatingCart(true)
    axios.get(`${API_ENDPOINT}/cart/update`, { params: { product: productid, button: buttonid }}).then((response) => { 
      setCartItems(response.data.cartItems)
      setCartInfo(response.data.cartInfo)
      setUpdatingCart(false)
    })
  }

  const orderPlaced = () => {
    axios.get(`${API_ENDPOINT}/cart/placed`).then((response) => { 
      navigate('/placed', {state: {orderedItems: response.data.cart.cartItems, orderInfo: response.data.cart.cartInfo, orderNumber: response.data.orderNumber}});
    })
  }

  return (
    !isLoading && (
    cartItems.length < 1 ? <Container><h2>Your Cart is Empty</h2></Container> :
    <Container>
      <h2 className='title'>Cart Items</h2>
      <Row xs={2} md={4} className="g-4">{cartItems.map((product) => (
        <Col key={product.id}>
          <Card className="h-100">
            <Card.Img src={require(`../Images/${product.image}`)}/>
            <Card.Body>
              <Card.Title>{product.name}</Card.Title>            
            </Card.Body>
            <Card.Footer>
              <Card.Subtitle>
                Price: ${product.price}<br/>
                Total: ${product.price * product.qty}<br/>   
                <div className='qty-container'>
                  <div className="qty-selector">
                    <button id='subtract' className='qty-sub' onClick={button => update(product.id, button.target.id)} disabled = {updatingCart}>-</button>         
                    <input value={product.qty} id="qty" className="qty-input" readOnly></input>                    
                    <button id='add' className='qty-add' onClick={button => update(product.id, button.target.id)} disabled = {updatingCart}>+</button>
                  </div>                  
                  <a id='remove' className="delete" onClick={e => update(product.id, e.target.id)} disabled = {updatingCart}>Delete</a>
                </div>
              </Card.Subtitle>
            </Card.Footer>
          </Card>
        </Col>))}
      </Row> <br/>
        Subtotal: ${cartInfo.subtotal} <br/>
        Tax: ${cartInfo.tax} <br/>
        Total: ${cartInfo.total} <br/>
        <Button onClick={() => {orderPlaced()}}>Place Order</Button> 
    </Container>
    )
  )
}
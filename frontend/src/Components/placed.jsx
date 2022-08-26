import { Container, Col, Card, Row } from 'react-bootstrap'
import { useLocation } from 'react-router-dom';

const Placed = () => {
  
  const location = useLocation()
  const orderedItems = location.state.orderedItems
  const orderNumber = location.state.orderNumber
  const orderInfo = location.state.orderInfo

  return (
    <Container>
      <h2>Order # {orderNumber}</h2>
      <Row xs={2} md={4} className="g-4">{orderedItems.map((product) => (
        <Col key={product.id}>
          <Card className="h-100">
          <Card.Img src={require(`../Images/${product.image}`)}/>
            <Card.Body>
              <Card.Title>{product.name}</Card.Title>
              <Card.Footer className="placed-footer">
                <Card.Subtitle>
                  Price: ${product.price}<br/>
                  Qty: {product.qty}<br/>
                  Total: ${product.price * product.qty}<br/>
                </Card.Subtitle>
              </Card.Footer>
            </Card.Body>
          </Card>
        </Col>))}
      </Row> <br/>
      <Col> 
        Subtotal: ${orderInfo.subtotal} <br/>
        Tax: ${orderInfo.tax} <br/>
        Paid: ${orderInfo.total} <br/>
      </Col>
    </Container>
  )
}

export default Placed
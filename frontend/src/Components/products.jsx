import { useEffect, useState } from "react";
import {
  Button,
  Row,
  Col,
  Card,
  Tooltip,
  OverlayTrigger,
  Container
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Products() {

  axios.defaults.withCredentials = true;

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT

  const [listOfProducts, setListOfProducts] = useState([])
  const [updatingCart, setUpdatingCart] = useState(false)
  let { handle } = useParams();

  useEffect(() => {
    axios.get(`${API_ENDPOINT}/products`).then((response) => {
      const productArray = response.data;
      setListOfProducts(
        productArray.filter((product) => product.category === handle)
      );
    });
  }, []);

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Added
    </Tooltip>
  );

  const onAdd = (productid) => {
    setUpdatingCart(true)
    axios.get(`${API_ENDPOINT}/products/added`, { params: { product: productid }}).then((response) => {
      setUpdatingCart(false)
    });
  };

  return (
    <Container>
      <Row xs={2} md={4} className="g-4">
        {listOfProducts.map((product) => (
          <Col key={product.id}>
            <Card className="h-100">
              <Card.Img src={require(`../Images/${product.image}`)} />
              <Card.Body className="d-flex flex-column">
                <Card.Title>{product.name}</Card.Title>
              </Card.Body>
              <Card.Footer>                
                <Card.Subtitle className="mb-2">${product.price}</Card.Subtitle> 
                <OverlayTrigger 
                  trigger="click"
                  rootClose
                  placement={"right"}
                  overlay={renderTooltip}
                >
                  <Button className="mt-auto" onClick={() => onAdd(product.id)} disabled = {updatingCart}>Add to Cart</Button>
                </OverlayTrigger>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

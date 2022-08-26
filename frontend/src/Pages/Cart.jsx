import { Container } from 'react-bootstrap'
import CartItems from "../Components/cartItems.jsx";

export default function Cart({ loginStatus, userEmail }) {

  return (
    <Container>
      <CartItems
        loginStatus={loginStatus}
        userEmail={userEmail}
      />
    </Container>
  );
}

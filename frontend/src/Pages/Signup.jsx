import { Container } from 'react-bootstrap'
import Input from '../Components/input.jsx'

export default function Signup({loginStatus, userEmail}) {
  return (
    <Container>
      <Input loginStatus={loginStatus} userEmail={userEmail} />
    </Container>
)}
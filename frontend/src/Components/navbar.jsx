import { Navbar, NavDropdown, Nav, Container } from "react-bootstrap"
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const renderDropdown = (category) => {
  return <NavDropdown.Item key={category.id} href={category.id}>{category.name}</NavDropdown.Item>
}

export default function Navbars({loginStatus, userEmail, onChange }) {
  
  axios.defaults.withCredentials = true

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT
  const [listOfCategories, setListOfCategories] = useState([])  
  const navigate = useNavigate()

  useEffect(() => {
    axios.get(`${API_ENDPOINT}/categories`).then((response) => {
      setListOfCategories(response.data)
    })
  },[])

  const logout = () => {  
    axios.get(`${API_ENDPOINT}/logout`).then((response) => {
      onChange(false)
      navigate('/login', { state: { message: response.data }})
    })
  }

  return (
    <Navbar collapseOnSelect expand="md" bg="dark" variant="dark">
      <Container className="navbar-container">
      <Navbar.Brand href="/">E-Commerce</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
          
          <Nav className="me-auto">
          <NavDropdown title="PC Parts" id="collasible-nav-dropdown">            
          {listOfCategories.map(renderDropdown)}
          </NavDropdown>          
          <Nav.Link href="/cart">Cart</Nav.Link>
          </Nav>

          <Nav>
            {loginStatus ?
              <>
              <Navbar.Text> {`Hello, ${userEmail}`}</Navbar.Text>
              <Nav.Link href="/orders">Orders</Nav.Link> 
              <Nav.Link onClick={() => logout()}>Log Out</Nav.Link>
              </>
              : 
              <>
              <Nav.Link href="/login">Login</Nav.Link>         
              <Nav.Link href="/sign-up">Sign-Up</Nav.Link>
              </>}
          </Nav>

      </Navbar.Collapse>
      </Container>
    </Navbar>
    )
}
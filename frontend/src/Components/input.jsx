import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button, Col } from "react-bootstrap";
import styles from "../form.module.css";

export default function Input({ loginStatus, userEmail }) {
  
  axios.defaults.withCredentials = true;

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT

  const navigate = useNavigate();
  const location = useLocation();   
  const [message, setMessage] = useState(false)
  const [currentRoute, setCurrentRoute] = useState(location.pathname.substring(1));
  const upperCase = (word) => {
    const str = word.charAt(0).toUpperCase() + word.slice(1);
    return str;
  };

  useEffect(() => {
    if (location.state)
      setMessage(location.state.message)
      window.history.replaceState({}, document.title)
  }, [])

  const submit = async (event) => {
    event.preventDefault();
    const emailValue = document.getElementById("formBasicEmail").value;
    const passValue = document.getElementById("formBasicPassword").value;

    setCurrentRoute(location.pathname.substring(1));

    await axios
      .post(`${API_ENDPOINT}/${currentRoute}`, {
        formEmail: emailValue,
        formPass: passValue,
      })
      .then((response) => {
        if (response.data === true) {
          navigate("/");
          window.location.reload();
        } else 
            setMessage(response.data)
      });
  };

  if (loginStatus) 
    return <h2>You are already logged in as {userEmail}</h2>
  return (
    <>
      <div className={styles.input_container}>
        <h2>{upperCase(currentRoute)}</h2>
        <br />
        <Form onSubmit={submit} className={styles.input_form}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email address</Form.Label>
            <Col>
              <Form.Control type="email" placeholder="Enter email" required />
            </Col>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Col>
              <Form.Control type="password" placeholder="Password" required />
            </Col>
          </Form.Group>
          <Button variant="primary" type="submit">
            {upperCase(currentRoute)}
          </Button>
        </Form>    
      </div> 
      {message && <h4>{message}</h4>}
    </>
  );
}

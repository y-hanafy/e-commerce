import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios'
import Navbars from './Components/navbar.jsx';
import Home from './Pages/Home.jsx'
import Category from './Pages/Category.jsx';
import Cart from './Pages/Cart.jsx';
import Placed from './Components/placed.jsx';
import Login from './Pages/Login.jsx';
import Signup from './Pages/Signup.jsx';
import Orders from './Pages/Orders.jsx';
import './App.css';

export default function App() {
  
  axios.defaults.withCredentials = true

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT

  const [loginStatus, setLoginStatus] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API_ENDPOINT}/userInfo`).then((response) => {
      if (response.data) {
        setLoginStatus(true)
        setUserEmail(response.data.email)
      }        
      setIsLoading(false)
    })
  }, [])

  return (    
    !isLoading &&
    <Router>
    <Navbars loginStatus={loginStatus} userEmail={userEmail} onChange={value => setLoginStatus(value)}/>
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/:handle" element={<Category />}/>
      <Route path="/cart" element={<Cart />}/>
      <Route path="/placed" element={<Placed />}/>
      <Route path="/login" element={<Login loginStatus={loginStatus} userEmail={userEmail} />}/>
      <Route path="/sign-up" element={<Signup loginStatus={loginStatus} userEmail={userEmail} />}/>
      <Route path="/orders" element={<Orders loginStatus={loginStatus} />}/>
    </Routes>
  </Router> 
  )
}
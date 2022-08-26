import { Table, Container } from 'react-bootstrap'
import React from 'react'
import axios from 'axios'
import { useEffect, useState } from 'react'

export default function Orders({ loginStatus }) {

  axios.defaults.withCredentials = true

  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {          
    axios.get(`${API_ENDPOINT}/orders`).then((response) => {
      setOrders(response.data)
      setIsLoading(false)
    })
  },[])

  let itemGroup = (items, property, symbol='') => (
    <Table responsive className="item-group">
      <tbody>   
      {items.map((item) => (
        <tr key={item.id}>
          <td>{symbol}{item[property]}</td>
        </tr>))}
      </tbody>
    </Table>
  )

  if (!loginStatus) 
    return <Container><h2>Login to see your orders</h2></Container>
    
  return (
    !isLoading && (
    orders.length < 1 ? 
      <Container><h2>No orders yet</h2></Container> 
      :
      <Container>
        <h2>Your Orders</h2>
        <Table striped bordered responsive>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Subtotal</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Item</th>          
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (  
            <tr key={order.orderInfo.id}>
              <td>{order.orderInfo.id}</td>
              <td>{order.orderInfo.date}</td>
              <td>${order.orderInfo.subtotal}</td>
              <td>${order.orderInfo.tax}</td>
              <td>${order.orderInfo.total}</td>
              <td>{itemGroup(order.orderItems, 'name')}</td>
              <td>{itemGroup(order.orderItems, 'qty')}</td>
              <td>{itemGroup(order.orderItems, 'price', '$')}</td>
            </tr>
          ))}
        </tbody>
        </Table> 
      </Container>
    ) 
  )
}
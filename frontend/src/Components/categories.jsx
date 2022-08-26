import { Row, Col, Card, Container } from 'react-bootstrap'
import { useEffect, useState } from 'react';
import axios from 'axios'

const renderCard = (category) => {
  return (
    <Col key={category.id}>
      <Card.Link className="text-decoration-none text-dark text-center" href={category.id} >
        <Card >
          <Card.Img src={require(`../Images/${category.image}`)}/>
            <Card.Title>{category.name}</Card.Title>
        </Card>
      </Card.Link>
    </Col>
  )
}

export default function Categories() {

  const [listOfCategories, setListOfCategories] = useState([])
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT

  useEffect(() => {
    axios.get(`${API_ENDPOINT}/categories`).then((response) => {
      setListOfCategories(response.data)
  })
  },[])

  return <Container><Row xs={2} md={4} className="g-4">{listOfCategories.map(renderCard)}</Row></Container>
}
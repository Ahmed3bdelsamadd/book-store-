# Emo Store API Documentation

Base URL:
http://localhost:5000

## Public APIs

### Get Products
GET /api/products

Optional query parameters:
- subject=Science
- subject=Chemistry
- stage=Primary
- stage=Preparatory
- stage=Secondary
- q=search text

Examples:
GET /api/products
GET /api/products?subject=Science
GET /api/products?stage=Secondary
GET /api/products?q=chemistry

### Create Order
POST /api/orders

Body:
{
  "name": "Customer Name",
  "address": "Customer Address",
  "phone": "+201228899050",
  "items": [],
  "total": 500
}

## Admin APIs

### Login
POST /api/login

Body:
{
  "username": "admin",
  "password": "123456"
}

Response:
{
  "token": "..."
}

Use token in Authorization header:
Authorization: Bearer TOKEN

### Check Current Admin
GET /api/me

### Add Product
POST /api/products

Headers:
Authorization: Bearer TOKEN

Body:
{
  "title": "Book Name",
  "subject": "Science",
  "stage": "Secondary",
  "grade": "Grade 3 Secondary",
  "price": 170,
  "oldPrice": 200,
  "discount": 15,
  "stock": 25,
  "icon": "⚛",
  "description": "Book description"
}

### Update Product
PUT /api/products/:id

### Delete Product
DELETE /api/products/:id

### Get Orders
GET /api/orders

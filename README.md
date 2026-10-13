# Secure JWT Authentication System

A secure authentication REST API built with Node.js, Express,
TypeScript, and MongoDB.

## Features

- User registration
- bcrypt password hashing
- Email verification
- JWT authentication
- Protected profile endpoint
- Forgot password
- Password reset
- Expiring verification and reset tokens
- Input validation
- Environment-based configuration

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Nodemailer

## Setup

1. Clone the repository.
2. Install dependencies:

   npm install

3. Create a `.env` file in the project root.

4. Configure the following variables:

   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret
   JWT_EXPIRES_IN=1h
   NODE_ENV=development

5. Start the development server:

   npm run dev

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register | Register a user |
| POST | /api/auth/login | Login |
| GET | /api/auth/verify-email/:token | Verify email |
| GET | /api/auth/profile | Protected profile |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/reset-password/:token | Reset password |
| GET | /api/health | Health check |

## Development Email Flow

In development mode, verification and password-reset tokens
are printed in the server terminal for testing.

Configure an email provider before using real email delivery.

## Security

- Passwords are hashed before storage.
- JWT access tokens expire after one hour.
- Verification and reset tokens expire.
- Sensitive configuration belongs in `.env`.
- Never commit `.env` to GitHub.

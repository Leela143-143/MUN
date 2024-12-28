# Model United Nations (MUN) Website Backend

This is the backend server for the Model United Nations (MUN) website. It provides APIs for user management, community management, and role-based access control.

## Features

- User authentication and authorization
- Role-based access control (Owner, Admin, User)
- Community management
- Country assignment system
- Real-time updates using Firebase

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase project and credentials

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Generate a new private key from Project Settings > Service Accounts
   - Update the `.env` file with your Firebase credentials

5. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/add-admin` - Add admin (Owner only)

### Communities

- `GET /api/community` - Get all communities
- `POST /api/community` - Create new community (Admin/Owner)
- `GET /api/community/:id` - Get community details
- `GET /api/community/:id/countries` - Get available countries

### Users

- `GET /api/user/:id` - Get user profile
- `GET /api/user` - Get all users (Admin/Owner)
- `PUT /api/user/:id` - Update user profile
- `GET /api/user/community/:communityId` - Get users by community (Admin/Owner)

## Role-Based Access

1. **Owner**
   - Can add/remove admins
   - Full access to all communities and users
   - Email: `klgv2005@gmail.com`

2. **Admin**
   - Can create and manage communities
   - Can view users in their communities

3. **User**
   - Can join communities
   - Can select available countries
   - Can view their community details

## Security

- All endpoints are protected with Firebase Authentication
- Role-based middleware ensures proper access control
- Environment variables for sensitive credentials
- Token verification for all authenticated requests

## Error Handling

The API includes comprehensive error handling for:
- Invalid authentication
- Insufficient permissions
- Resource not found
- Invalid input data
- Server errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 
# 🤖 AskAI - Intelligent Chat Application

A modern, full-stack AI chat application built with React and Node.js, featuring real-time streaming responses, secure authentication, and a beautiful dark-themed UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)

## ✨ Features

### 🔐 Authentication & Security
- **Email/Password Authentication** with OTP verification
- **Google OAuth 2.0** integration for seamless login
- **Guest Mode** for quick access without registration
- **Password Reset** functionality with email OTP
- **JWT-based** secure session management
- **Rate Limiting** to prevent abuse

### 💬 Chat Experience
- **Real-time Streaming** responses with typing effect
- **Markdown Support** including tables, lists, and code blocks
- **Syntax Highlighting** for code snippets with copy button
- **Multiple Chat Sessions** with persistent history
- **Collapsible Sidebar** for better focus
- **Chat History Management** - save, load, and delete conversations

### 🎨 User Interface
- **Modern Dark Theme** with gradient accents
- **Responsive Design** works on all devices
- **Smooth Animations** and transitions
- **Clean Typography** for better readability
- **Intuitive Navigation** with keyboard shortcuts

### ⚡ Technical Highlights
- **Groq AI Integration** for fast, intelligent responses
- **MongoDB** for scalable data storage
- **Express.js** backend with RESTful API
- **Vite** for lightning-fast frontend development
- **Email Notifications** via Resend/Nodemailer

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Groq API Key ([Get it here](https://console.groq.com/))
- Resend API Key for emails ([Get it here](https://resend.com/))

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_random_secret_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_email@domain.com
FRONTEND_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
```

Backend will run on: `http://localhost:3001`

### Frontend Setup

```bash
cd frontend
npm install
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the frontend:
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## 📁 Project Structure

```
ai-chat-app/
├── backend/
│   ├── models/          # MongoDB schemas (User, Chat, OTP)
│   ├── routes/          # API endpoints (auth, chat, history, password)
│   ├── middleware/      # Auth middleware
│   ├── utils/           # Email utilities
│   └── server.js        # Express server
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   └── vite.config.js   # Vite configuration
└── README.md
```

## 🔧 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code highlighting
- **Google OAuth** - Social authentication

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **Groq SDK** - AI integration
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Resend/Nodemailer** - Email service
- **Express Rate Limit** - API protection

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/set-password` - Set password for Google users
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat` - Send message and get AI response (streaming)

### History
- `GET /api/history` - Get all chat sessions
- `POST /api/history` - Save chat session
- `DELETE /api/history/:id` - Delete chat session

### Password Reset
- `POST /api/password/forgot` - Request password reset OTP
- `POST /api/password/reset` - Reset password with OTP

## 🔒 Environment Variables

### Backend (.env)
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/ai-chat
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚢 Deployment

### Backend (Render/Railway/Heroku)
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variables
6. Deploy

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for blazing-fast AI inference
- [React](https://react.dev/) for the amazing UI library
- [MongoDB](https://www.mongodb.com/) for the database
- [Resend](https://resend.com/) for email delivery

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Note:** This project is under active development. More features coming soon! 🚀

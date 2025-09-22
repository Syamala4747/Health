# ZenCare Mental Health Platform

A comprehensive mental health platform designed for educational institutions, featuring role-based dashboards for administrators, college heads, counsellors, and students.

## 🏗️ Project Structure

```
ZenCare/
├── frontend/              # React Web Application
├── backend/               # Node.js Express Server
├── mobile/                # React Native Mobile App
├── ai-services/           # AI/ML Services (Future)
├── docs/                  # Documentation
├── infrastructure/        # Docker, Firebase configs
├── scripts/               # Utility scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ZenCare
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Configure your Firebase settings in .env
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd ../backend
   npm install
   # Configure Firebase admin credentials
   npm start
   ```

4. **Setup Mobile App**
   ```bash
   cd ../mobile
   npm install
   npx expo start
   ```

## 🎯 Features

### For Students
- **Mental Health Assessments**: PHQ-9, GAD-7 standardized assessments
- **AI Counselor**: 24/7 AI-powered mental health support
- **Counselor Booking**: Schedule appointments with verified counselors
- **Resource Hub**: Access mental health resources and educational content
- **Progress Tracking**: Monitor mental health journey over time

### For Counselors
- **Student Dashboard**: Manage assigned students and their progress
- **Assessment Analytics**: View detailed student assessment results
- **Chat Interface**: Secure communication with students
- **Appointment Management**: Schedule and manage counseling sessions

### For College Heads
- **College Management**: Oversee counselors and students in their institution
- **Approval System**: Approve counselor registrations for their college
- **Analytics Dashboard**: View college-wide mental health statistics
- **Reporting**: Generate institutional mental health reports

### For Administrators
- **System Management**: Oversee entire platform operation
- **College Head Approval**: Approve college head registrations
- **Analytics**: System-wide statistics and insights
- **User Management**: Handle escalated issues and system maintenance

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **Firebase** for authentication and database

### Backend
- **Node.js** with Express
- **Firebase Admin SDK**
- **Socket.io** for real-time communication
- **Winston** for logging

### Mobile
- **React Native** with Expo
- **React Navigation** for routing
- **Firebase** integration

### Infrastructure
- **Firebase Firestore** for database
- **Firebase Auth** for authentication
- **Firebase Storage** for file uploads
- **Docker** for containerization

## 📱 Multi-Platform Support

- **Web Application**: Full-featured dashboard for all user roles
- **Mobile App**: Student-focused mobile experience
- **Responsive Design**: Works on all screen sizes

## 🔐 Security Features

- **Role-based Access Control**: Secure role separation
- **Firebase Authentication**: Industry-standard auth
- **ID Proof Verification**: Document verification for role validation
- **Secure File Upload**: Safe document handling
- **Data Encryption**: End-to-end security

## 🌐 Multi-language Support

- English (Default)
- Hindi
- Tamil
- Telugu

## 📊 Assessment Tools

- **PHQ-9**: Depression screening
- **GAD-7**: Anxiety assessment
- **Custom Assessments**: Institution-specific evaluations
- **AI-Enhanced Analysis**: ML-powered insights

## 🔄 Development Workflow

1. **Frontend Development**: `cd frontend && npm run dev`
2. **Backend Development**: `cd backend && npm run dev`
3. **Mobile Development**: `cd mobile && npx expo start`
4. **Full Stack**: Use Docker Compose for integrated development

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [AI Integration Guide](docs/AI_INTEGRATION_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- AI/ML integration for predictive analytics
- Advanced reporting and dashboard features
- Integration with external mental health resources
- Mobile app feature parity with web application
- Real-time crisis intervention system

---

**Built with ❤️ for mental health awareness and support**
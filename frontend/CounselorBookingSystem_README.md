# Counselor Booking System - Complete Setup Guide

## 🎯 Overview

A comprehensive counselor booking system that allows students to find and book appointments with verified mental health professionals from their college. Features include intelligent filtering, real-time availability, detailed counselor profiles, and seamless appointment management.

## ✨ Features

### 🔍 **Smart Counselor Discovery**
- Filter by specialization (Anxiety, Depression, Academic Stress, etc.)
- Language preferences (English, Hindi, regional languages)
- Session modes (Video call, In-person, Phone call)
- Availability status (Today's slots, Emergency availability)
- Rating and review-based sorting

### 📋 **Detailed Counselor Profiles**
- Professional credentials and licenses
- Education and certifications
- Specializations and experience
- Student reviews and ratings
- Weekly availability schedule
- Booking policies and preferences

### 📅 **Advanced Booking System**
- Visual calendar interface
- Real-time slot availability
- Multi-step booking process
- Session type selection (Individual, Group, Crisis)
- Emergency consultation support
- Instant vs. approval-based booking

### 🔄 **Real-time Updates**
- Firebase integration for live data
- Automatic availability updates
- Booking confirmations and notifications
- Conflict detection and prevention

## 🏗️ Architecture

```
📁 Counselor Booking System
├── 📁 components/
│   ├── CounselorBooking.jsx          # Main listing component
│   ├── CounselorProfileDialog.jsx    # Detailed counselor view
│   ├── BookingDialog.jsx             # Appointment booking
│   └── CounselorCard.jsx             # Individual counselor cards
├── 📁 services/
│   └── counselorBookingService.js    # Firebase operations
├── 📁 types/
│   └── counselor.js                  # Data structures
└── 📁 pages/
    └── CounselorBookingPage.jsx      # Usage example
```

## 🚀 Quick Setup

### 1. **Install Dependencies**
```bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install firebase
```

### 2. **Import Components**
```jsx
import CounselorBooking from './components/CounselorBooking'
import { counselorService } from './services/counselorBookingService'
```

### 3. **Basic Usage**
```jsx
function App() {
  const userCollege = {
    id: 'college_1',
    name: 'Your College Name'
  }

  return (
    <CounselorBooking 
      userCollege={userCollege}
      userProfile={{ 
        id: 'student_id',
        name: 'Student Name',
        email: 'student@college.edu'
      }}
    />
  )
}
```

## 📊 Data Structure

### **Counselor Profile**
```javascript
{
  id: 'counselor_1',
  name: 'Dr. Priya Sharma',
  title: 'Licensed Clinical Psychologist',
  college: {
    id: 'college_1',
    name: 'IIT Delhi'
  },
  specializations: ['Anxiety', 'Depression', 'Academic Stress'],
  languages: ['English', 'Hindi'],
  sessionModes: ['Video call', 'In-person'],
  availability: {
    schedule: {
      monday: { available: true, slots: ['09:00', '10:00'] }
    }
  },
  rating: 4.8,
  totalReviews: 127,
  bookingSettings: {
    emergencyAvailable: true,
    instantBooking: false
  }
}
```

### **Appointment Booking**
```javascript
{
  counselorId: 'counselor_1',
  studentId: 'student_1',
  scheduledTime: new Date(),
  sessionType: 'Individual Counseling',
  sessionMode: 'Video call',
  status: 'confirmed',
  notes: 'Student notes...'
}
```

## 🔧 Firebase Integration

### **Collections Structure**
```
firestore/
├── counselors/           # Counselor profiles
├── appointments/         # Booking records
├── reviews/              # Student reviews
└── colleges/             # College information
```

### **Service Operations**
```javascript
// Get counselors from college
const counselors = await counselorService.getCounselorsByCollege('college_1')

// Book appointment
const appointmentId = await appointmentService.bookAppointment({
  counselorId: 'counselor_1',
  studentId: 'student_1',
  scheduledTime: new Date(),
  sessionType: 'Individual Counseling'
})

// Get student appointments
const appointments = await appointmentService.getStudentAppointments('student_1')
```

## 🎨 Customization

### **Theme Integration**
```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  }
})

<ThemeProvider theme={theme}>
  <CounselorBooking />
</ThemeProvider>
```

### **Custom Filters**
```jsx
<CounselorBooking 
  customFilters={{
    showEmergencyOnly: true,
    hideUnavailable: true,
    minRating: 4.0
  }}
/>
```

## 📱 Responsive Design

The system is fully responsive and works seamlessly across:
- **Desktop**: Full feature set with side-by-side layouts
- **Tablet**: Optimized card layouts and touch interactions
- **Mobile**: Stack layouts with swipe gestures and mobile-first design

## 🔒 Security & Privacy

### **Data Protection**
- All personal data encrypted at rest
- HIPAA-compliant data handling
- Anonymous review system
- Secure session management

### **Access Control**
- Student-only access to college counselors
- Counselor verification system
- Admin approval for new counselors
- Role-based permissions

## 📈 Analytics & Insights

### **Booking Analytics**
- Popular time slots
- Counselor utilization rates
- Student booking patterns
- Cancellation trends

### **Performance Metrics**
- Average booking completion time
- User satisfaction scores
- System response times
- Mobile vs desktop usage

## 🚨 Emergency Features

### **Crisis Support**
- Emergency consultation flags
- Immediate counselor notification
- Crisis resource directory
- Automatic escalation protocols

### **Emergency Contacts**
```jsx
{
  crisis: {
    hotline: '988',
    campus: 'campus-emergency@college.edu',
    local: '+91-XXX-XXX-XXXX'
  }
}
```

## 🔄 Real-time Features

### **Live Updates**
- Slot availability changes
- Booking confirmations
- Counselor status updates
- Emergency notifications

### **WebSocket Integration**
```javascript
// Subscribe to real-time updates
const unsubscribe = counselorService.subscribeToCounselorUpdates(
  counselorId, 
  (updatedCounselor) => {
    // Handle real-time updates
    updateCounselorData(updatedCounselor)
  }
)
```

## 📋 Testing

### **Component Testing**
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import CounselorBooking from './CounselorBooking'

test('displays counselors from user college', () => {
  render(<CounselorBooking userCollege={{ id: 'test_college' }} />)
  expect(screen.getByText('Counselors at')).toBeInTheDocument()
})
```

### **Integration Testing**
- Firebase emulator testing
- E2E booking workflows
- Cross-browser compatibility
- Mobile device testing

## 🚀 Deployment

### **Environment Setup**
```bash
# Production environment variables
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_ENVIRONMENT=production
```

### **Performance Optimization**
- Component lazy loading
- Image optimization
- Firebase query optimization
- CDN integration for static assets

## 📚 API Documentation

### **Counselor Service**
```javascript
// Search with filters
counselorService.searchCounselors(collegeId, {
  specialization: 'Anxiety',
  language: 'Hindi',
  emergencyAvailable: true,
  sortBy: 'rating'
})

// Real-time subscription
counselorService.subscribeToCounselorUpdates(counselorId, callback)
```

### **Appointment Service**
```javascript
// Check availability
appointmentService.checkTimeSlotAvailability(counselorId, dateTime)

// Book appointment
appointmentService.bookAppointment(appointmentData)

// Update status
appointmentService.updateAppointmentStatus(appointmentId, 'confirmed')
```

## 🔮 Future Enhancements

### **Planned Features**
- AI-powered counselor matching
- Virtual reality therapy sessions
- Mood tracking integration
- Group therapy booking
- Family counseling support
- Multi-language interface

### **Integration Roadmap**
- Calendar app synchronization
- Email notification system
- SMS reminder service
- Video conferencing integration
- Payment processing (if required)

## 💡 Usage Examples

### **For Students**
```jsx
// Student dashboard integration
<StudentDashboard>
  <CounselorBooking 
    userCollege={student.college}
    userProfile={student}
    showQuickBook={true}
  />
</StudentDashboard>
```

### **For Counselors**
```jsx
// Counselor management interface
<CounselorDashboard>
  <AppointmentManager counselorId={counselor.id} />
  <AvailabilitySettings counselor={counselor} />
</CounselorDashboard>
```

### **For Administrators**
```jsx
// Admin panel integration
<AdminPanel>
  <CounselorManagement college={college} />
  <BookingAnalytics />
  <SystemSettings />
</AdminPanel>
```

## 🆘 Support & Resources

### **Documentation**
- [Component API Reference](./docs/api.md)
- [Firebase Setup Guide](./docs/firebase.md)
- [Styling Guide](./docs/styling.md)
- [Troubleshooting](./docs/troubleshooting.md)

### **Community**
- GitHub Issues for bug reports
- Discord community for discussions
- Weekly office hours for developers

---

## 🎉 Ready to Launch!

Your counselor booking system is now ready to help students connect with mental health professionals. The system provides a comprehensive, user-friendly interface for booking, managing, and tracking counseling appointments while maintaining privacy and security standards.

For support or questions, please refer to the documentation or reach out to the development team.
/**
 * Counselor data types and structures for booking system
 */

// Counselor profile structure
export const CounselorProfile = {
  id: 'string',
  name: 'string',
  email: 'string',
  phone: 'string',
  avatar: 'string',
  
  // Professional details
  title: 'string', // e.g., "Licensed Clinical Social Worker"
  license: 'string', // License number
  experience: 'number', // Years of experience
  
  // College affiliation
  college: {
    id: 'string',
    name: 'string',
    department: 'string'
  },
  
  // Specializations
  specializations: ['array'], // e.g., ['Anxiety', 'Depression', 'Academic Stress']
  
  // Languages spoken
  languages: ['array'], // e.g., ['English', 'Hindi', 'Tamil']
  
  // Availability
  availability: {
    schedule: {
      monday: { available: 'boolean', slots: ['array'] },
      tuesday: { available: 'boolean', slots: ['array'] },
      wednesday: { available: 'boolean', slots: ['array'] },
      thursday: { available: 'boolean', slots: ['array'] },
      friday: { available: 'boolean', slots: ['array'] },
      saturday: { available: 'boolean', slots: ['array'] },
      sunday: { available: 'boolean', slots: ['array'] }
    },
    timezone: 'string'
  },
  
  // Session details
  sessionTypes: ['array'], // e.g., ['Individual', 'Group', 'Crisis']
  sessionModes: ['array'], // e.g., ['In-person', 'Video call', 'Phone call']
  sessionDuration: 'number', // Minutes
  
  // Ratings and reviews
  rating: 'number', // Average rating out of 5
  totalReviews: 'number',
  reviews: ['array'],
  
  // Booking settings
  bookingSettings: {
    advanceBookingDays: 'number', // How many days in advance can book
    cancellationPolicy: 'string',
    emergencyAvailable: 'boolean',
    instantBooking: 'boolean'
  },
  
  // Profile details
  bio: 'string',
  education: ['array'],
  certifications: ['array'],
  
  // Status
  isActive: 'boolean',
  isVerified: 'boolean',
  lastSeen: 'timestamp',
  
  // Metadata
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
}

// Booking/Appointment structure
export const BookingAppointment = {
  id: 'string',
  studentId: 'string',
  counselorId: 'string',
  
  // Appointment details
  scheduledTime: 'timestamp',
  duration: 'number', // Minutes
  sessionType: 'string', // Individual, Group, Crisis
  sessionMode: 'string', // In-person, Video call, Phone call
  
  // Booking details
  bookedAt: 'timestamp',
  status: 'string', // 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'
  
  // Communication
  notes: 'string', // Student's notes when booking
  counselorNotes: 'string', // Counselor's private notes
  
  // Location (for in-person sessions)
  location: {
    room: 'string',
    building: 'string',
    address: 'string'
  },
  
  // Meeting details (for virtual sessions)
  meetingLink: 'string',
  meetingId: 'string',
  
  // Follow-up
  followUpNeeded: 'boolean',
  followUpDate: 'timestamp',
  
  // Feedback
  studentFeedback: {
    rating: 'number',
    review: 'string',
    submitted: 'boolean'
  },
  
  // Metadata
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
}

// Sample counselor data
export const sampleCounselors = [
  {
    id: 'counselor_1',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@college.edu',
    phone: '+91-9876543210',
    avatar: '/avatars/counselor1.jpg',
    title: 'Licensed Clinical Psychologist',
    license: 'PSY-2019-0123',
    experience: 8,
    college: {
      id: 'college_1',
      name: 'Indian Institute of Technology Delhi',
      department: 'Student Counseling Center'
    },
    specializations: ['Anxiety Disorders', 'Academic Stress', 'Depression', 'Career Counseling'],
    languages: ['English', 'Hindi'],
    availability: {
      schedule: {
        monday: { 
          available: true, 
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] 
        },
        tuesday: { 
          available: true, 
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] 
        },
        wednesday: { 
          available: true, 
          slots: ['10:00', '11:00', '14:00', '15:00', '16:00'] 
        },
        thursday: { 
          available: true, 
          slots: ['09:00', '10:00', '14:00', '15:00', '16:00'] 
        },
        friday: { 
          available: true, 
          slots: ['09:00', '10:00', '11:00', '14:00'] 
        },
        saturday: { 
          available: false, 
          slots: [] 
        },
        sunday: { 
          available: false, 
          slots: [] 
        }
      },
      timezone: 'Asia/Kolkata'
    },
    sessionTypes: ['Individual Counseling', 'Group Therapy', 'Crisis Intervention'],
    sessionModes: ['In-person', 'Video call'],
    sessionDuration: 50,
    rating: 4.8,
    totalReviews: 127,
    bookingSettings: {
      advanceBookingDays: 14,
      cancellationPolicy: '24 hours advance notice required',
      emergencyAvailable: true,
      instantBooking: false
    },
    bio: 'Dr. Priya Sharma has over 8 years of experience in helping students overcome academic stress, anxiety, and depression. She specializes in cognitive-behavioral therapy and mindfulness-based interventions.',
    education: [
      'Ph.D. in Clinical Psychology - AIIMS Delhi',
      'M.A. in Psychology - Delhi University'
    ],
    certifications: [
      'Licensed Clinical Psychologist',
      'Certified CBT Therapist',
      'Mindfulness-Based Stress Reduction (MBSR) Certified'
    ],
    isActive: true,
    isVerified: true,
    lastSeen: new Date(),
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'counselor_2',
    name: 'Dr. Raj Kumar',
    email: 'raj.kumar@college.edu',
    phone: '+91-9876543211',
    avatar: '/avatars/counselor2.jpg',
    title: 'Licensed Professional Counselor',
    license: 'LPC-2020-0456',
    experience: 6,
    college: {
      id: 'college_1',
      name: 'Indian Institute of Technology Delhi',
      department: 'Student Counseling Center'
    },
    specializations: ['Relationship Issues', 'Social Anxiety', 'Self-esteem', 'Cultural Adjustment'],
    languages: ['English', 'Hindi', 'Punjabi'],
    availability: {
      schedule: {
        monday: { 
          available: true, 
          slots: ['10:00', '11:00', '15:00', '16:00', '17:00'] 
        },
        tuesday: { 
          available: true, 
          slots: ['09:00', '10:00', '15:00', '16:00', '17:00'] 
        },
        wednesday: { 
          available: false, 
          slots: [] 
        },
        thursday: { 
          available: true, 
          slots: ['10:00', '11:00', '15:00', '16:00'] 
        },
        friday: { 
          available: true, 
          slots: ['09:00', '10:00', '11:00', '15:00', '16:00'] 
        },
        saturday: { 
          available: true, 
          slots: ['10:00', '11:00', '12:00'] 
        },
        sunday: { 
          available: false, 
          slots: [] 
        }
      },
      timezone: 'Asia/Kolkata'
    },
    sessionTypes: ['Individual Counseling', 'Couples Counseling'],
    sessionModes: ['In-person', 'Video call', 'Phone call'],
    sessionDuration: 45,
    rating: 4.6,
    totalReviews: 89,
    bookingSettings: {
      advanceBookingDays: 7,
      cancellationPolicy: '12 hours advance notice required',
      emergencyAvailable: false,
      instantBooking: true
    },
    bio: 'Dr. Raj Kumar specializes in helping students navigate relationship challenges, social anxiety, and cultural adjustment issues. He uses an integrative approach combining CBT and solution-focused therapy.',
    education: [
      'M.A. in Counseling Psychology - Jamia Millia Islamia',
      'B.A. in Psychology - Delhi University'
    ],
    certifications: [
      'Licensed Professional Counselor',
      'Certified Solution-Focused Therapist'
    ],
    isActive: true,
    isVerified: true,
    lastSeen: new Date(),
    createdAt: new Date('2022-03-20'),
    updatedAt: new Date()
  },
  {
    id: 'counselor_3',
    name: 'Ms. Anita Patel',
    email: 'anita.patel@college.edu',
    phone: '+91-9876543212',
    avatar: '/avatars/counselor3.jpg',
    title: 'Licensed Mental Health Counselor',
    license: 'LMHC-2021-0789',
    experience: 4,
    college: {
      id: 'college_1',
      name: 'Indian Institute of Technology Delhi',
      department: 'Student Counseling Center'
    },
    specializations: ['Eating Disorders', 'Body Image', 'Perfectionism', 'Study Skills'],
    languages: ['English', 'Hindi', 'Gujarati'],
    availability: {
      schedule: {
        monday: { 
          available: true, 
          slots: ['11:00', '12:00', '14:00', '15:00'] 
        },
        tuesday: { 
          available: true, 
          slots: ['11:00', '12:00', '14:00', '15:00', '16:00'] 
        },
        wednesday: { 
          available: true, 
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] 
        },
        thursday: { 
          available: true, 
          slots: ['11:00', '12:00', '14:00', '15:00', '16:00'] 
        },
        friday: { 
          available: true, 
          slots: ['11:00', '12:00', '14:00'] 
        },
        saturday: { 
          available: false, 
          slots: [] 
        },
        sunday: { 
          available: true, 
          slots: ['14:00', '15:00', '16:00'] 
        }
      },
      timezone: 'Asia/Kolkata'
    },
    sessionTypes: ['Individual Counseling', 'Group Therapy'],
    sessionModes: ['In-person', 'Video call'],
    sessionDuration: 45,
    rating: 4.9,
    totalReviews: 156,
    bookingSettings: {
      advanceBookingDays: 10,
      cancellationPolicy: '24 hours advance notice required',
      emergencyAvailable: true,
      instantBooking: false
    },
    bio: 'Ms. Anita Patel is a specialist in eating disorders, body image issues, and perfectionism among students. She helps students develop healthy relationships with food, body, and academic expectations.',
    education: [
      'M.S. in Clinical Mental Health Counseling - Tata Institute of Social Sciences',
      'B.A. in Psychology - Gujarat University'
    ],
    certifications: [
      'Licensed Mental Health Counselor',
      'Certified Eating Disorder Specialist',
      'Body Image Therapy Certified'
    ],
    isActive: true,
    isVerified: true,
    lastSeen: new Date(),
    createdAt: new Date('2022-06-10'),
    updatedAt: new Date()
  }
]

// Specialization categories
export const specializationCategories = [
  {
    category: 'Emotional Health',
    specializations: ['Anxiety Disorders', 'Depression', 'Mood Disorders', 'Emotional Regulation']
  },
  {
    category: 'Academic Support',
    specializations: ['Academic Stress', 'Study Skills', 'Test Anxiety', 'Procrastination', 'Time Management']
  },
  {
    category: 'Social & Relationships',
    specializations: ['Social Anxiety', 'Relationship Issues', 'Communication Skills', 'Conflict Resolution']
  },
  {
    category: 'Life Transitions',
    specializations: ['Career Counseling', 'Cultural Adjustment', 'Life Transitions', 'Identity Issues']
  },
  {
    category: 'Specialized Care',
    specializations: ['Eating Disorders', 'Substance Abuse', 'Trauma Recovery', 'Crisis Intervention']
  },
  {
    category: 'Personal Development',
    specializations: ['Self-esteem', 'Confidence Building', 'Perfectionism', 'Mindfulness']
  }
]
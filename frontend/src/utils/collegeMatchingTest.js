/**
 * Test utility to create sample counsellor and student data for testing college matching
 * This file demonstrates how the college matching works
 */

import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase.js'

export const sampleColleges = [
  'ABC University',
  'XYZ College', 
  'MIT College',
  'Stanford University',
  'Harvard University',
  'IIT Delhi',
  'IIT Mumbai',
  'BITS Pilani',
  'VIT University',
  'SRM University'
]

export const sampleCounsellors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    college: 'ABC University',
    specialization: 'Clinical Psychology',
    experience: '8 years',
    qualifications: ['PhD in Clinical Psychology', 'Licensed Clinical Psychologist'],
    languages: ['English', 'Hindi']
  },
  {
    name: 'Dr. Raj Patel',
    email: 'raj.patel@example.com', 
    college: 'IIT Delhi',
    specialization: 'Counseling Psychology',
    experience: '5 years',
    qualifications: ['M.A. in Counseling Psychology', 'Certified Counselor'],
    languages: ['English', 'Hindi', 'Gujarati']
  },
  {
    name: 'Dr. Emily Chen',
    email: 'emily.chen@example.com',
    college: 'MIT College',
    specialization: 'Cognitive Behavioral Therapy',
    experience: '10 years', 
    qualifications: ['PhD in Psychology', 'CBT Specialist'],
    languages: ['English', 'Mandarin']
  }
]

export const sampleStudents = [
  {
    name: 'Alice Smith',
    email: 'alice.smith@example.com',
    university: 'ABC University', // Should match with Dr. Sarah Johnson
    major: 'Computer Science',
    year: '3rd Year',
    age: '21'
  },
  {
    name: 'Rohan Sharma',
    email: 'rohan.sharma@example.com',
    university: 'IIT Delhi', // Should match with Dr. Raj Patel
    major: 'Electrical Engineering', 
    year: '2nd Year',
    age: '20'
  },
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    university: 'VIT University', // No matching counsellor
    major: 'Mechanical Engineering',
    year: '1st Year', 
    age: '19'
  }
]

/**
 * Function to test college matching logic
 * This would be used in development/testing environments
 */
export const testCollegeMatching = () => {
  console.log('Testing College Matching Logic:')
  console.log('================================')
  
  sampleStudents.forEach(student => {
    const matchingCounsellors = sampleCounsellors.filter(
      counsellor => counsellor.college === student.university
    )
    
    console.log(`Student: ${student.name} (${student.university})`)
    if (matchingCounsellors.length > 0) {
      console.log(`  ✅ Matched with: ${matchingCounsellors.map(c => c.name).join(', ')}`)
    } else {
      console.log(`  ❌ No counsellors available from ${student.university}`)
    }
    console.log('')
  })
}

/**
 * Documentation for testing the implementation:
 * 
 * 1. Register a counsellor with college "ABC University"
 * 2. Register a student with university "ABC University" 
 * 3. Login as the student and check the dashboard
 * 4. The counsellor's name should appear in the "Your Assigned Counsellor" section
 * 
 * Expected Flow:
 * - Student registers with university: "ABC University"
 * - Counsellor registers with college: "ABC University" 
 * - When student logs in, useAssignedCounsellor hook:
 *   - Gets student's university from their profile
 *   - Queries counsellors with matching college
 *   - Returns random counsellor from same college
 *   - Student dashboard displays counsellor info
 */
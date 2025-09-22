// Simple migration script to run in the browser console
// This will migrate existing users to separate collections

import { db } from '../config/firebase.js'
import { migrateUsersToSeparateCollections } from './separateCollections.js'

export const runMigration = async () => {
  console.log('🔄 Starting migration process...')
  
  const result = await migrateUsersToSeparateCollections()
  
  if (result.success) {
    console.log('✅ Migration completed successfully!')
    console.log('📊 Summary:')
    console.log(`   • Students migrated: ${result.studentsCreated}`)
    console.log(`   • Counsellors migrated: ${result.counsellorsCreated}`)
    console.log(`   • Admins kept: ${result.adminsKept}`)
    
    alert(`Migration completed!\n\nStudents: ${result.studentsCreated}\nCounsellors: ${result.counsellorsCreated}\nAdmins: ${result.adminsKept}`)
  } else {
    console.error('❌ Migration failed:', result.error)
    alert(`Migration failed: ${result.error}`)
  }
  
  return result
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  window.runUserMigration = runMigration
}
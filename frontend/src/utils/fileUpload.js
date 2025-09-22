import { storage } from '../config/firebase.js'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'college-heads/documents/userId')
 * @param {string} fileName - Optional custom filename
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export const uploadFile = async (file, path, fileName = null) => {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Generate filename if not provided
    const finalFileName = fileName || `${Date.now()}_${file.name}`
    
    // Create storage reference
    const storageRef = ref(storage, `${path}/${finalFileName}`)
    
    console.log('📤 Uploading file to:', `${path}/${finalFileName}`)
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file)
    console.log('✅ File uploaded successfully')
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('🔗 Download URL generated:', downloadURL)
    
    return downloadURL
  } catch (error) {
    console.error('❌ Error uploading file:', error)
    throw error
  }
}

/**
 * Upload multiple files to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} path - The storage path
 * @returns {Promise<string[]>} - Array of download URLs
 */
export const uploadMultipleFiles = async (files, path) => {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadFile(file, path, `${Date.now()}_${index}_${file.name}`)
    )
    
    const downloadURLs = await Promise.all(uploadPromises)
    return downloadURLs
  } catch (error) {
    console.error('❌ Error uploading multiple files:', error)
    throw error
  }
}

/**
 * Upload college head documents (ID proof, profile photo, etc.)
 * @param {string} userId - The user's UID
 * @param {Object} files - Object containing files to upload
 * @returns {Promise<Object>} - Object containing download URLs
 */
export const uploadCollegeHeadDocuments = async (userId, files) => {
  try {
    const uploadedFiles = {}
    const basePath = `college-heads/${userId}`
    
    // Upload ID proof document
    if (files.idProof) {
      uploadedFiles.idProofUrl = await uploadFile(
        files.idProof, 
        `${basePath}/documents`, 
        `id_proof_${Date.now()}.${files.idProof.name.split('.').pop()}`
      )
    }
    
    // Upload profile photo
    if (files.profilePhoto) {
      uploadedFiles.profilePhotoUrl = await uploadFile(
        files.profilePhoto, 
        `${basePath}/photos`, 
        `profile_photo_${Date.now()}.${files.profilePhoto.name.split('.').pop()}`
      )
    }
    
    // Upload additional documents
    if (files.certificate) {
      uploadedFiles.certificateUrl = await uploadFile(
        files.certificate, 
        `${basePath}/documents`, 
        `certificate_${Date.now()}.${files.certificate.name.split('.').pop()}`
      )
    }
    
    if (files.resume) {
      uploadedFiles.resumeUrl = await uploadFile(
        files.resume, 
        `${basePath}/documents`, 
        `resume_${Date.now()}.${files.resume.name.split('.').pop()}`
      )
    }
    
    return uploadedFiles
  } catch (error) {
    console.error('❌ Error uploading college head documents:', error)
    throw error
  }
}

/**
 * Upload counsellor documents
 * @param {string} userId - The user's UID
 * @param {Object} files - Object containing files to upload
 * @returns {Promise<Object>} - Object containing download URLs
 */
export const uploadCounsellorDocuments = async (userId, files) => {
  try {
    const uploadedFiles = {}
    const basePath = `counsellors/${userId}`
    
    // Upload ID proof document
    if (files.idProof) {
      uploadedFiles.idProofUrl = await uploadFile(
        files.idProof, 
        `${basePath}/documents`, 
        `id_proof_${Date.now()}.${files.idProof.name.split('.').pop()}`
      )
    }
    
    // Upload profile photo
    if (files.profilePhoto) {
      uploadedFiles.profilePhotoUrl = await uploadFile(
        files.profilePhoto, 
        `${basePath}/photos`, 
        `profile_photo_${Date.now()}.${files.profilePhoto.name.split('.').pop()}`
      )
    }
    
    // Upload license document
    if (files.license) {
      uploadedFiles.licenseUrl = await uploadFile(
        files.license, 
        `${basePath}/documents`, 
        `license_${Date.now()}.${files.license.name.split('.').pop()}`
      )
    }
    
    // Upload qualifications
    if (files.qualifications) {
      uploadedFiles.qualificationsUrl = await uploadFile(
        files.qualifications, 
        `${basePath}/documents`, 
        `qualifications_${Date.now()}.${files.qualifications.name.split('.').pop()}`
      )
    }
    
    return uploadedFiles
  } catch (error) {
    console.error('❌ Error uploading counsellor documents:', error)
    throw error
  }
}
/**
 * Network connectivity tests for Firebase services
 */

export const testFirebaseConnectivity = async () => {
  const results = {
    firebase: false,
    firestore: false,
    auth: false,
    details: []
  }

  try {
    // Test 1: Basic Firebase Auth Domain connectivity
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    if (authDomain) {
      try {
        const response = await fetch(`https://${authDomain}`, { method: 'HEAD', mode: 'no-cors' })
        results.auth = true
        results.details.push('✅ Firebase Auth domain accessible')
      } catch (error) {
        results.details.push(`❌ Firebase Auth domain not accessible: ${error.message}`)
      }
    }

    // Test 2: Firestore connectivity
    try {
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
      const response = await fetch(firestoreUrl, { method: 'HEAD', mode: 'no-cors' })
      results.firestore = true
      results.details.push('✅ Firestore API accessible')
    } catch (error) {
      results.details.push(`❌ Firestore API not accessible: ${error.message}`)
    }

    // Test 3: General Firebase services
    try {
      const response = await fetch('https://firebase.googleapis.com', { method: 'HEAD', mode: 'no-cors' })
      results.firebase = true
      results.details.push('✅ Firebase services accessible')
    } catch (error) {
      results.details.push(`❌ Firebase services not accessible: ${error.message}`)
    }

  } catch (error) {
    results.details.push(`❌ Network test failed: ${error.message}`)
  }

  return results
}

export const getNetworkDiagnostics = () => {
  const diagnostics = {
    online: navigator.onLine,
    connection: navigator.connection || navigator.mozConnection || navigator.webkitConnection,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }

  return diagnostics
}

export const suggestNetworkFixes = (testResults) => {
  const suggestions = []

  if (!testResults.firebase || !testResults.firestore || !testResults.auth) {
    suggestions.push('🔧 Network connectivity issues detected. Try these solutions:')
    suggestions.push('1. Check your internet connection')
    suggestions.push('2. Disable VPN if you are using one')
    suggestions.push('3. Try a different network (mobile hotspot)')
    suggestions.push('4. Check if your firewall is blocking Firebase services')
    suggestions.push('5. Clear browser cache and cookies')
    suggestions.push('6. Try using a different browser')
    suggestions.push('7. Check with your network administrator about Firebase domains')
  }

  if (!navigator.onLine) {
    suggestions.push('❌ You appear to be offline. Please check your internet connection.')
  }

  return suggestions
}
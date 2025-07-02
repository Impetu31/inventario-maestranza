import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyALOuyVfoEUpfcRA_rFV_9jfGw9rQU5tZU",
  authDomain: "inventariomaestranza.firebaseapp.com",
  projectId: "inventariomaestranza",
  storageBucket: "inventariomaestranza.appspot.com", // 🔧 CORREGIDO .app → .appspot.com
  messagingSenderId: "233274253821",
  appId: "1:233274253821:web:c80510955880db966a7994"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { auth, db }

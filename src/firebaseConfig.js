const admin = require('firebase-admin');

function initializeFirebase() {
  // Đọc credentials từ environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'ncln-50535.appspot.com'
  });
  return admin.storage();
}

const storage = initializeFirebase();

async function testFirebaseConnection() {
  try {
    const bucket = storage.bucket();
    const testFile = bucket.file('test/connection_test.txt');
    await testFile.save('Hello, Firebase!');
    const [url] = await testFile.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });
    //console.log('Firebase connection successful. Test file URL:', url);
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

module.exports = { storage, testFirebaseConnection };

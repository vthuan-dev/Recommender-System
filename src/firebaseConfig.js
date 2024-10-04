const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./config/ncln-50535-firebase-adminsdk-ce3b3-334fa0eb08.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const storage = admin.storage();

// Hàm kiểm tra kết nối
async function testFirebaseConnection() {
  try {
    const bucket = storage.bucket();
    const file = bucket.file('test/connection_test.txt');
    await file.save('Hello, Firebase!');
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });
    console.log('Firebase connection successful. Test file URL:', url);
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
}

module.exports = { storage, testFirebaseConnection };
const admin = require('firebase-admin');
const serviceAccount = require('./config/ncln-50535-firebase-adminsdk-ce3b3-334fa0eb08.json');

function initializeFirebase() {
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

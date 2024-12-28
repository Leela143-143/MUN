const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Get user details from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .get();

    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Check if it's the owner
    if (email === 'klgv2005@gmail.com') {
      if (!userData.role || userData.role !== 'owner') {
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'owner' });
        await admin.firestore().collection('users').doc(userRecord.uid).set({
          ...userData,
          role: 'owner',
          email,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      return res.json({ 
        role: 'owner', 
        uid: userRecord.uid,
        user: { ...userData, role: 'owner' }
      });
    }

    // For other users, return their role and data
    const customClaims = (await admin.auth().getUser(userRecord.uid)).customClaims || {};
    res.json({
      role: customClaims.role || userData.role || 'user',
      uid: userRecord.uid,
      user: userData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, communityId, country } = req.body;

    // Validate required fields
    if (!name || !email || !password || !communityId || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if community exists and has available countries
    const communityDoc = await admin.firestore()
      .collection('communities')
      .doc(communityId)
      .get();

    if (!communityDoc.exists) {
      return res.status(400).json({ error: 'Community not found' });
    }

    const communityData = communityDoc.data();
    if (communityData.availableCountries <= 0) {
      return res.status(400).json({ error: 'No available countries in this community' });
    }

    // Check if country is available
    const usersWithCountry = await admin.firestore()
      .collection('users')
      .where('communityId', '==', communityId)
      .where('country', '==', country)
      .get();

    if (!usersWithCountry.empty) {
      return res.status(400).json({ error: 'Country is already taken' });
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Add user details to Firestore
    const userData = {
      name,
      email,
      communityId,
      country,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Update community's available countries
    await admin.firestore().collection('communities').doc(communityId).update({
      availableCountries: admin.firestore.FieldValue.increment(-1)
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });

    res.status(201).json({ 
      uid: userRecord.uid,
      user: userData
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add admin route (owner only)
router.post('/add-admin', async (req, res) => {
  try {
    const { email } = req.body;
    const callerUid = req.user.uid; // From auth middleware

    // Verify caller is owner
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can add admins' });
    }

    // Get user to be made admin
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Set admin role in Auth and Firestore
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Admin role assigned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove admin route (owner only)
router.post('/remove-admin', async (req, res) => {
  try {
    const { email } = req.body;
    const callerUid = req.user.uid; // From auth middleware

    // Verify caller is owner
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || callerDoc.data().role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can remove admins' });
    }

    // Get user to remove admin role
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Remove admin role in Auth and Firestore
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });
    await admin.firestore().collection('users').doc(userRecord.uid).update({
      role: 'user',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Admin role removed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 
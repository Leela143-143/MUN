const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const doc = await admin.firestore()
      .collection('users')
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get community details
    const communityDoc = await admin.firestore()
      .collection('communities')
      .doc(doc.data().communityId)
      .get();

    res.json({
      id: doc.id,
      ...doc.data(),
      community: communityDoc.exists ? { id: communityDoc.id, ...communityDoc.data() } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (Admin/Owner only)
router.get('/', async (req, res) => {
  try {
    const callerUid = req.headers.authorization;
    
    // Verify caller is admin or owner
    const callerClaims = (await admin.auth().getUser(callerUid)).customClaims;
    if (!callerClaims?.role || (callerClaims.role !== 'admin' && callerClaims.role !== 'owner')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const usersSnapshot = await admin.firestore()
      .collection('users')
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const callerUid = req.headers.authorization;

    // Verify caller is the user themselves or an admin/owner
    const callerClaims = (await admin.auth().getUser(callerUid)).customClaims;
    if (callerUid !== req.params.id && 
        (!callerClaims?.role || (callerClaims.role !== 'admin' && callerClaims.role !== 'owner'))) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await admin.firestore()
      .collection('users')
      .doc(req.params.id)
      .update({
        name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get users by community (Admin/Owner only)
router.get('/community/:communityId', async (req, res) => {
  try {
    const callerUid = req.headers.authorization;
    
    // Verify caller is admin or owner
    const callerClaims = (await admin.auth().getUser(callerUid)).customClaims;
    if (!callerClaims?.role || (callerClaims.role !== 'admin' && callerClaims.role !== 'owner')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('communityId', '==', req.params.communityId)
      .get();

    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
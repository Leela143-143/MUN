const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all communities
router.get('/', async (req, res) => {
  try {
    const communitiesSnapshot = await admin.firestore()
      .collection('communities')
      .get();

    const communities = [];
    for (const doc of communitiesSnapshot.docs) {
      const communityData = doc.data();
      const usersCount = (await admin.firestore()
        .collection('users')
        .where('communityId', '==', doc.id)
        .count()
        .get()).data().count;

      communities.push({
        id: doc.id,
        ...communityData,
        usersCount
      });
    }

    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new community with logo (Admin/Owner only)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, totalCountries } = req.body;
    if (!name || !totalCountries) {
      return res.status(400).json({ error: 'Name and total countries are required' });
    }

    const callerUid = req.user.uid;

    // Verify caller is admin or owner
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || !['admin', 'owner'].includes(callerDoc.data().role)) {
      return res.status(403).json({ error: 'Only admins and owners can create communities' });
    }

    // Generate placeholder country names
    const countries = Array.from({ length: parseInt(totalCountries) }, (_, i) => `Country${i + 1}`);

    let logoUrl = null;
    if (req.file) {
      const bucket = admin.storage().bucket();
      const fileName = `community-logos/${Date.now()}-${req.file.originalname}`;
      const fileUpload = bucket.file(fileName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: req.file.mimetype
        }
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', resolve);
        blobStream.end(req.file.buffer);
      });

      await fileUpload.makePublic();
      logoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    }

    const communityData = {
      name,
      totalCountries: parseInt(totalCountries),
      availableCountries: parseInt(totalCountries),
      countries,
      logoUrl,
      events: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid
    };

    const docRef = await admin.firestore()
      .collection('communities')
      .add(communityData);

    res.status(201).json({ id: docRef.id, ...communityData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add event to community
router.post('/:id/events', async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const communityId = req.params.id;
    const callerUid = req.user.uid;

    // Verify caller is admin or owner
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || !['admin', 'owner'].includes(callerDoc.data().role)) {
      return res.status(403).json({ error: 'Only admins and owners can add events' });
    }

    const event = {
      title,
      description,
      date,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid
    };

    await admin.firestore()
      .collection('communities')
      .doc(communityId)
      .update({
        events: admin.firestore.FieldValue.arrayUnion(event)
      });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update community logo
router.put('/:id/logo', upload.single('logo'), async (req, res) => {
  try {
    const callerUid = req.user.uid;
    const communityId = req.params.id;

    // Verify caller is admin or owner
    const callerDoc = await admin.firestore()
      .collection('users')
      .doc(callerUid)
      .get();

    if (!callerDoc.exists || !['admin', 'owner'].includes(callerDoc.data().role)) {
      return res.status(403).json({ error: 'Only admins and owners can update community logo' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    // Delete old logo if exists
    const communityDoc = await admin.firestore()
      .collection('communities')
      .doc(communityId)
      .get();

    if (communityDoc.exists && communityDoc.data().logoUrl) {
      const oldLogoPath = communityDoc.data().logoUrl.split('/').pop();
      try {
        await admin.storage().bucket().file(`community-logos/${oldLogoPath}`).delete();
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    const bucket = admin.storage().bucket();
    const fileName = `community-logos/${Date.now()}-${req.file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });

    await new Promise((resolve, reject) => {
      blobStream.on('error', reject);
      blobStream.on('finish', resolve);
      blobStream.end(req.file.buffer);
    });

    await fileUpload.makePublic();
    const logoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    await admin.firestore()
      .collection('communities')
      .doc(communityId)
      .update({
        logoUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ logoUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get community details with events
router.get('/:id', async (req, res) => {
  try {
    const doc = await admin.firestore()
      .collection('communities')
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const communityData = doc.data();

    // Get users in this community
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('communityId', '==', req.params.id)
      .get();

    const users = [];
    usersSnapshot.forEach(userDoc => {
      users.push({ id: userDoc.id, ...userDoc.data() });
    });

    // Sort events by date
    const events = communityData.events || [];
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      id: doc.id,
      ...communityData,
      users,
      events
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available countries in a community
router.get('/:id/countries', async (req, res) => {
  try {
    const doc = await admin.firestore()
      .collection('communities')
      .doc(req.params.id)
      .get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Get assigned countries
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('communityId', '==', req.params.id)
      .get();

    const assignedCountries = new Set();
    usersSnapshot.forEach(userDoc => {
      assignedCountries.add(userDoc.data().country);
    });

    // Filter available countries
    const allCountries = doc.data().countries;
    const availableCountries = allCountries.filter(country => !assignedCountries.has(country));

    res.json({
      availableCountries,
      totalCountries: allCountries.length,
      assignedCountries: Array.from(assignedCountries)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
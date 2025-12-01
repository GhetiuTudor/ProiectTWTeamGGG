// src/controllers/attendController.js
const prisma = require('../config/prisma');

exports.joinEvent = async (req, res) => {
  const { accessCode } = req.body;
  
  // 1. Verificăm userul
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Trebuie să fii autentificat.' });
  }
  const userId = req.user.id;

  try {
    const event = await prisma.event.findUnique({
      where: { accessCode: accessCode }
    });

    if (!event) {
      return res.status(404).json({ error: 'Cod de acces invalid.' });
    }

    if (event.status === 'CLOSE') {
        return res.status(400).json({ error: 'Evenimentul a fost închis.' });
    }

    const now = new Date();
    if (now < new Date(event.startTime)) {
        return res.status(400).json({ error: 'Evenimentul nu a început încă.' });
    }
    if (now > new Date(event.endTime)) {
        return res.status(400).json({ error: 'Evenimentul s-a terminat.' });
    }

    const existingCheckIn = await prisma.attendance.findFirst({
        where: {
            userId: userId,
            eventId: event.id
        }
    });

    if (existingCheckIn) {
        return res.status(409).json({ 
            error: 'Ai făcut deja check-in la acest eveniment! Nu te poți înscrie de două ori.' 
        });
    }
    const attendance = await prisma.attendance.create({
      data: {
        userId: userId,
        eventId: event.id
      }
    });

    res.json({ success: true, message: 'Check-in reușit!', data: attendance });

  } catch (error) {
    console.error("Eroare server:", error);
    res.status(500).json({ error: 'Eroare internă server.' });
  }
};
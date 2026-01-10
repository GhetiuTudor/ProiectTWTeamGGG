// src/controllers/attendController.js
const prisma = require('../config/prisma');

// Permite unui utilizator sa faca check in la un eveniment folosind codul de acces cu diverse verificari
exports.joinEvent = async (req, res) => {
  const { accessCode } = req.body;

  // 1. Verificam userul
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Trebuie sa fii autentificat.' });
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
      return res.status(400).json({ error: 'Evenimentul a fost inchis.' });
    }

    const now = new Date();
    if (now < new Date(event.startTime)) {
      return res.status(400).json({ error: 'Evenimentul nu a inceput inca.' });
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
        error: 'Ai facut deja check-in la acest eveniment! Nu te poti inscrie de doua ori.'
      });
    }
    const attendance = await prisma.attendance.create({
      data: {
        userId: userId,
        eventId: event.id
      }
    });

    res.json({ success: true, message: 'Check-in reusit!', data: attendance });

  } catch (error) {
    console.error("Eroare server:", error);
    res.status(500).json({ error: 'Eroare interna server.' });
  }
};

exports.getJoinedEvents = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Neautentificat' });
  }

  try {
    const history = await prisma.attendance.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            attendances: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    // Transform data for easier frontend usage
    const data = history.map(record => {
      const others = record.event.attendances.map(a => a.user.name);
      return {
        eventName: record.event.title,
        joinedAt: record.joinedAt,
        totalParticipants: others.length,
        participantNames: others
      };
    });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Eroare istoric' });
  }
};
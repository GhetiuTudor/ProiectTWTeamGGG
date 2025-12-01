const { group } = require('console');
const prisma = require('../config/prisma');
const { Parser } = require('json2csv');
const crypto = require('crypto'); 

const generateCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

exports.createEventGroup = async(req,res) => {
    const { name, description, events } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Utilizator neautentificat corect." });
  }
    const organizerId = req.user.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const group = await tx.eventGroup.create({
                data: {name, description, organizerId}
            });

            const eventsData = events.map(evt => ({
                groupId: group.id,
                title: evt.title,
                startTime: new Date(evt.startTime),
                endTime: new Date(evt.endTime),
                accessCode: generateCode(),
                status: 'OPEN'
            }));

            await tx.event.createMany ({ data: eventsData });
            const fullGroup = await tx.eventGroup.findUnique({
              where: { id: group.id },
              include: { events: true }
            })
            return fullGroup;
        });
        res.json({ succes: true, group: result });
    } catch (error) {
        console.error(error);
        res.status(500).json ({error: 'Eroare la creare grup'});
    }
};

exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        attendances: {
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });
    
    if(!event) return res.status(404).json({error: 'Eveniment negăsit'});
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Eroare server' });
  }
};

exports.toggleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; 

  try {
    const event = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status: status }
    });
    res.json({ message: `Evenimentul este acum ${status}`, event });
  } catch (error) {
    res.status(500).json({ error: 'Eroare actualizare status' });
  }
};



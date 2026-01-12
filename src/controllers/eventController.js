const prisma = require('../config/prisma');
const { Parser } = require('json2csv');
const crypto = require('crypto');
const ExcelJS = require('exceljs');

// Genereaza un cod unic de acces
const generateCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Creeaza un grup de evenimente si evenimentele asociate
exports.createEventGroup = async (req, res) => {
  const { name, description, events } = req.body;
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Utilizator neautentificat corect." });
  }
  const organizerId = req.user.id;

  // validam daca start time < end time
  for (let event of events) {
    if (new Date(event.startTime) >= new Date(event.endTime)) {
      return res.status(400).json({ error: `Eroare: Evenimentul "${event.title}" are ora de start >= ora de sfarsit.` });
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newGroup = await tx.eventGroup.create({
        data: { name, description, organizerId }
      });

      const eventsData = events.map(eventData => {
        const start = new Date(eventData.startTime);
        const end = new Date(eventData.endTime);
        const now = new Date();

        let initialStatus = 'CLOSE';
        if (now >= start && now < end) {
          initialStatus = 'OPEN';
        }

        return {
          groupId: newGroup.id,
          title: eventData.title,
          startTime: start,
          endTime: end,
          accessCode: generateCode(),
          status: initialStatus
        };
      });

      await tx.event.createMany({ data: eventsData });
      const fullGroup = await tx.eventGroup.findUnique({
        where: { id: newGroup.id },
        include: { events: true }
      });
      return fullGroup;
    });
    res.json({ succes: true, group: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la creare grup' });
  }
};

exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await prisma.event.findUnique({ where: { id: parseInt(id) }, include: { group: true } });
    if (!event) return res.status(404).json({ error: 'Eveniment inexistent' });
    if (event.group.organizerId !== req.user.id) return res.status(403).json({ error: 'Nu aveti permisiunea.' });

    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { eventId: parseInt(id) } }),
      prisma.event.delete({ where: { id: parseInt(id) } })
    ]);
    res.json({ message: 'Eveniment sters' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare stergere eveniment' });
  }
};

exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await prisma.eventGroup.findUnique({ where: { id: parseInt(groupId) } });
    if (!group) return res.status(404).json({ error: 'Grup inexistent' });
    if (group.organizerId !== req.user.id) return res.status(403).json({ error: 'Nu aveti permisiunea.' });

   
    await prisma.$transaction(async (tx) => {
      
      const events = await tx.event.findMany({ where: { groupId: parseInt(groupId) }, select: { id: true } });
      const eventIds = events.map(e => e.id);
      
      await tx.attendance.deleteMany({ where: { eventId: { in: eventIds } } });
     
      await tx.event.deleteMany({ where: { groupId: parseInt(groupId) } });

      await tx.eventGroup.delete({ where: { id: parseInt(groupId) } });
    });

    res.json({ message: 'Grup sters complet' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare stergere grup' });
  }
};


// Returneaza toate grupurile de evenimente create de organizatorul curent
exports.getMyEvents = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Utilizator neautentificat." });
  }
  const organizerId = req.user.id;

  try {
    const groups = await prisma.eventGroup.findMany({
      where: { organizerId: organizerId },
      include: {
        events: {
          orderBy: { startTime: 'asc' },
          include: {
            attendances: {
              include: { user: true },
              orderBy: { joinedAt: 'desc' }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la preluarea evenimentelor.' });
  }
};


// Returneaza detaliile unui eveniment inclusiv participantii
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

    if (!event) return res.status(404).json({ error: 'Eveniment negasit' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Eroare server' });
  }
};

// Schimba statusul unui eveniment OPEN sau CLOSE
exports.toggleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status: status }
    });
    res.json({ message: `Evenimentul este acum ${status}`, event: updatedEvent });
  } catch (error) {
    res.status(500).json({ error: 'Eroare actualizare status' });
  }
};

// Exporta prezenta la un eveniment in format CSV sau XLSX
exports.exportEventStats = async (req, res) => {
  const { id } = req.params;
  const { format } = req.query;
  try {
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        group: true,
        attendances: {
          include: { user: true },
          orderBy: { joinedAt: 'asc' }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Eveniment inexistent.' });

    // Flat Data pentru export
    const exportData = event.attendances.map(attendance => ({
      Nume_Participant: attendance.user.name,
      Email: attendance.user.email,
      Data_CheckIn: attendance.joinedAt.toLocaleString('ro-RO'),
      Eveniment: event.title,
      Cod_Acces: event.accessCode
    }));

    if (format === 'csv') {
      const fields = ['Nume_Participant', 'Email', 'Data_CheckIn', 'Eveniment', 'Cod_Acces'];
      const json2csvParser = new Parser({ fields });
      const csvContent = json2csvParser.parse(exportData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`Prezenta_Eveniment_${id}.csv`);
      return res.send(csvContent);
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Participanti');
      sheet.columns = [
        { header: 'Nume Participant', key: 'Nume_Participant', width: 30 },
        { header: 'Email', key: 'Email', width: 35 },
        { header: 'Data Check-In', key: 'Data_CheckIn', width: 25 },
        { header: 'Eveniment', key: 'Eveniment', width: 30 },
        { header: 'Cod Acces', key: 'Cod_Acces', width: 15 }
      ];
      sheet.addRows(exportData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Prezenta_Eveniment_${id}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }

    return res.status(400).json({ error: 'Format necunoscut. Foloseste ?format=csv sau ?format=xlsx' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la export.' });
  }
};

// Exporta raportul pentru un intreg grup de evenimente
exports.exportGroupStats = async (req, res) => {
  const { groupId } = req.params;
  const { format } = req.query;
  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        event: { groupId: parseInt(groupId) }
      },
      include: {
        user: true,
        event: { include: { group: true } }
      },
      orderBy: [
        { event: { startTime: 'asc' } },
        { user: { name: 'asc' } }
      ]
    });

    if (attendances.length === 0) {
      return res.status(404).json({ error: 'Nu exista date pentru acest grup.' });
    }

    const exportData = attendances.map(attendance => ({
      Grup: attendance.event.group.name,
      Eveniment: attendance.event.title,
      Data_Eveniment: attendance.event.startTime.toLocaleDateString('ro-RO'),
      Nume_Participant: attendance.user.name,
      Email: attendance.user.email,
      Data_CheckIn: attendance.joinedAt.toLocaleString('ro-RO')
    }));

    if (format === 'csv') {
      const fields = ['Grup', 'Eveniment', 'Data_Eveniment', 'Nume_Participant', 'Email', 'Data_CheckIn'];
      const json2csvParser = new Parser({ fields });
      const csvContent = json2csvParser.parse(exportData);

      res.header('Content-Type', 'text/csv');
      res.attachment(`Raport_Grup_${groupId}.csv`);
      return res.send(csvContent);
    }

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Raport Grup');

      sheet.columns = [
        { header: 'Grup', key: 'Grup', width: 25 },
        { header: 'Eveniment', key: 'Eveniment', width: 30 },
        { header: 'Data Ev.', key: 'Data_Eveniment', width: 15 },
        { header: 'Nume Participant', key: 'Nume_Participant', width: 30 },
        { header: 'Email', key: 'Email', width: 35 },
        { header: 'Data Check-In', key: 'Data_CheckIn', width: 25 }
      ];

      sheet.addRows(exportData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Raport_Grup_${groupId}.xlsx`);

      await workbook.xlsx.write(res);
      return res.end();
    }
    return res.status(400).json({ error: 'Format necunoscut.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Eroare la exportul grupului' });
  }
};

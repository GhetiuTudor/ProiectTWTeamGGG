const prisma = require('../config/prisma');

const initScheduler = () => {
    console.log('Scheduler started: Checking event status every minute.');

    // Check every 60 seconds
    setInterval(async () => {
        const now = new Date();

        try {
            // 1. OPEN events that should be OPEN (Start <= now < End) AND currently CLOSED
            const eventsToOpen = await prisma.event.updateMany({
                where: {
                    status: 'CLOSE',
                    startTime: { lte: now },
                    endTime: { gt: now }
                },
                data: { status: 'OPEN' }
            });

            if (eventsToOpen.count > 0) {
                console.log(`Scheduler: Opened ${eventsToOpen.count} events.`);
            }

            // 2. CLOSE events that have ended (End <= now) AND currently OPEN
            const eventsToClose = await prisma.event.updateMany({
                where: {
                    status: 'OPEN',
                    endTime: { lte: now }
                },
                data: { status: 'CLOSE' }
            });

            if (eventsToClose.count > 0) {
                console.log(`Scheduler: Closed ${eventsToClose.count} events.`);
            }

        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    }, 60000);
};

module.exports = initScheduler;

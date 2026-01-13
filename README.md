# ProiectTWTeamGGG
Attendance monitoring web app

https://proiect-tw-team-ggg.vercel.app/login

1. Obiectiv general

Obiectivul proiectului este realizarea unei aplicatii web care permite monitorizarea prezentei participantilor la evenimente. Platforma trebuie sa ofere un backend RESTful in Node.js si Express, care utilizeaza o baza de date relationala prin intermediul unui ORM, si un frontend Single Page Application creat cu React.js. 

Aplicatia trebuie sa permita organizatorilor sa creeze grupuri de evenimente, evenimente individuale, sa genereze coduri pentru accesul participantilor si sa monitorizeze prezenta in timp real. Participantii pot introduce sau scana codul evenimentului pentru confirmarea prezentei.


2. Specificatii proiect

Pentru organizator (OE)
	1.	Crearea unui grup de evenimente.
	2.	Crearea unuia sau mai multor evenimente asociate unui grup, inclusiv evenimente recurente.
	3.	Fiecare eveniment este initial in starea CLOSED. La momentul programat, trece automat in starea OPEN, iar la final revine in CLOSED.
	4.	Generarea unui cod de acces si posibilitatea reprezentarii acestuia sub forma de QR code sau cod text.
	5.	Afișarea codului generat (de exemplu pe un proiector).
	6.	Vizualizarea listei participantilor si momentul confirmarii prezentei.
	7.	Exportul listei de prezenta pentru un eveniment sau pentru intregul grup, in format CSV sau XLSX.

Pentru participant
	1.	Introducerea codului de acces al evenimentului sau scanarea QR code-ului.
	2.	Confirmarea prezentei in timpul in care evenimentul este deschis.


3. Tehnologii utilizate

Frontend
	•	React.js
	•	TypeScript
	•	React Router
	•	TanStack React Query
	
Backend
	•	Node.js
	•	Express
	•	TypeScript
	•	Prisma ORM
	•	PostgreSQL
	•	JWT pentru autentificare

  4. Planul

Aplicatia este impartita in doua componente principale:
	1.	Backend (REST API): gestioneaza autentificarea, evenimentele, prezentele, generarea codurilor, exportul datelor si accesul la serviciul extern.
	2.	Frontend SPA: integreaza functionalitatile pentru organizatori si participanti, ruleaza in browser si comunica exclusiv cu API-ul REST.

Modelarea datelor include urmatoarele entitati:
	•	User (organizator sau participant)
	•	EventGroup
	•	Event
	•	Attendance

Starea evenimentului (OPEN/CLOSED) este gestionata automat pe baza timpului si prin cron.

Baza de date
	•	PostgreSQL (local + productie via Neon/Render/Railway)

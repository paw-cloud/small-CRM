// Zmyślone dane do zrzutów ekranu (żadnych prawdziwych klientów).
(function () {
  const db = window.__db;
  const p2 = (n) => String(n).padStart(2, '0');
  const ymd = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); };
  const ts = (off, h, m) => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(h, m || 0, 0, 0); return d.toISOString(); };
  const id = (kind, n) => kind + '0000000-0000-4000-8000-' + String(n).padStart(12, '0');

  db.companies.length = 0; db.contacts.length = 0; db.notes.length = 0; db.inquiries.length = 0; db.audit_log.length = 0;
  const base = (extra) => Object.assign({ created_at: ts(-30, 9), updated_at: ts(-2, 11), updated_by: 'Marek' }, extra);

  [
    [1, 'Nordic Home AB', '556123-4567', '+46 8 123 45 67', 'kontakt@nordichome.example', 'nordichome.example', 'Storgatan 12', 'Sztokholm', 'Stały klient, zamówienia sezonowe.'],
    [2, 'Bureau Moderne SARL', 'FR 12 345678901', '+33 4 12 34 56 78', 'bonjour@bureaumoderne.example', 'bureaumoderne.example', '5 Rue de la République', 'Lyon', ''],
    [3, 'Holz & Form GmbH', 'DE 123456789', '+49 89 123456', 'info@holzform.example', 'holzform.example', 'Hauptstraße 8', 'Monachium', 'Projekty dla hoteli.'],
    [4, 'Biuro Plus Sp. z o.o.', '583-123-45-67', '+48 58 123 45 67', 'biuro@biuroplus.example', 'biuroplus.example', 'ul. Długa 4', 'Gdańsk', '']
  ].forEach(([n, name, nip, phone, email, website, address, city, description]) => db.companies.push(base({ id: id('b', n), name, nip, phone, email, website, address, city, description })));

  [
    [1, 1, 'Anna', 'Lindqvist', 'Kierownik zakupów', 'anna@nordichome.example', '+46 70 123 45 67'],
    [2, 1, 'Johan', 'Berg', 'Dyrektor operacyjny', 'johan@nordichome.example', ''],
    [3, 2, 'Marc', 'Dupont', 'Właściciel', 'marc@bureaumoderne.example', '+33 6 12 34 56 78'],
    [4, 3, 'Stefan', 'Bauer', 'Architekt wnętrz', 'stefan@holzform.example', '+49 171 1234567'],
    [5, 4, 'Ewa', 'Nowak', 'Asystentka zarządu', 'ewa@biuroplus.example', '+48 601 123 456']
  ].forEach(([n, comp, first_name, last_name, position, email, phone]) => db.contacts.push(base({ id: id('c', n), company_id: id('b', comp), first_name, last_name, position, email, phone, description: '' })));

  const A = 'Anna Lindqvist / Nordic Home', M = 'Marc Dupont / Bureau Moderne', S = 'Stefan Bauer / Holz & Form', E = 'Ewa Nowak / Biuro Plus';
  const R = 'Erik Solberg / Fjord Café', P = 'Pieter de Vries / Studio Oost', L = 'Lena Vogel / Vogel Design';
  // [nr, klient, kraj, kod, opis, następny krok, grupa, termin (dni od dziś), data zapytania (dni od dziś), firma]
  [
    [41, A, 'Szwecja', 'SE', 'Wycena 20 krzeseł do biura', 'Wysłać wycenę do końca tygodnia.', 'action', -2, -6, 1],
    [43, M, 'Francja', 'FR', 'Seria 100 szt. wieszaków', 'Zadzwonić i dopytać o termin dostawy.', 'action', 0, -4, 2],
    [46, S, 'Niemcy', 'DE', 'Stoły konferencyjne, 12 szt.', 'Przygotować rysunki techniczne.', 'action', 2, -3, 3],
    [38, E, 'Polska', 'PL', 'Meble do recepcji', 'Przypomnieć się, jeśli brak odpowiedzi.', 'followup', 4, -15, 4],
    [40, R, 'Norwegia', 'NO', 'Lady barowe do kawiarni', 'Zapytać o decyzję po wizycie w showroomie.', 'followup', 7, -11, null],
    [35, L, 'Austria', 'AT', 'Prototyp szafki', 'Czekamy na akceptację prototypu.', 'waiting', null, -24, null],
    [37, P, 'Holandia', 'NL', 'Fotele do hotelu, 40 szt.', 'Czekamy na decyzję o zamówieniu serii.', 'waiting', null, -19, null],
    [44, A, 'Szwecja', 'SE', 'Stoliki kawowe, 15 szt.', 'Wycena wysłana, czekamy na odpowiedź.', 'waiting', null, -8, 1]
  ].forEach(([n, client, country, cc, description, next_step, status, due, rec, comp]) => db.inquiries.push(base({
    id: id('a', n), number: '26' + String(n).padStart(3, '0'), client, country, cc, description, next_step, status, done: false, archived_at: null,
    due_date: due == null ? null : ymd(due), received_at: ymd(rec), company_id: comp ? id('b', comp) : null, author: 'Marek', created_at: ts(rec, 10) })));
  db.inquiries.find((i) => i.number === '26035').updated_at = ts(-20, 10);   // dla paska „Dzisiaj”: jedno zapytanie „bez ruchu”
  [
    [12, A, 'Szwecja', 'SE', 'Stoły do restauracji, 8 szt.', -120, -85, 1], [15, M, 'Francja', 'FR', 'Krzesła barowe, 24 szt.', -105, -70, 2],
    [19, S, 'Niemcy', 'DE', 'Zabudowa recepcji', -96, -60, 3], [21, E, 'Polska', 'PL', 'Meble biurowe, komplet', -88, -55, 4],
    [24, R, 'Norwegia', 'NO', 'Ławy do kawiarni', -70, -48, null], [27, P, 'Holandia', 'NL', 'Półki na wymiar', -62, -40, null],
    [30, A, 'Szwecja', 'SE', 'Ławki ogrodowe, 10 szt.', -50, -30, 1], [32, L, 'Austria', 'AT', 'Szafka łazienkowa (seria)', -44, -22, null]
  ].forEach(([n, client, country, cc, description, rec, arch, comp]) => db.inquiries.push(base({
    id: id('a', n), number: '26' + String(n).padStart(3, '0'), client, country, cc, description, next_step: '', status: 'waiting', done: true, archived_at: ts(arch, 12),
    due_date: null, received_at: ymd(rec), company_id: comp ? id('b', comp) : null, author: 'Marek', created_at: ts(rec, 10) })));

  const note = (inq, comp, contact, kind, body, author, off, h) => db.notes.push({ id: crypto.randomUUID(), inquiry_id: inq ? id('a', inq) : null, company_id: comp ? id('b', comp) : null, contact_id: contact ? id('c', contact) : null, kind, body, author, created_at: ts(off, h, 15) });
  note(41, 1, 1, 'call', 'Rozmowa z Anną: potrzebuje 20 krzeseł do nowego biura, zależy jej na dostawie przed końcem miesiąca.', 'Marek', -6, 10);
  note(41, 1, 1, 'email', 'Wysłano rysunki wstępne i zapytanie o wykończenie (tkanina czy skóra).', 'Kasia', -4, 14);
  note(41, 1, 1, 'note', 'Klient wybrał tkaninę, kolor grafitowy. Do wyceny doliczyć transport do Sztokholmu.', 'Marek', -2, 9);
  note(44, 1, 2, 'meeting', 'Spotkanie w showroomie z Johanem, obejrzał próbki blatów.', 'Kasia', -7, 13);
  note(null, 1, 1, 'note', 'Anna woli kontakt e-mailowy, telefon tylko w pilnych sprawach.', 'Marek', -25, 11);

  // prywatne zadania właściciela (zmyślone; widoczne tylko w zrzucie okienka „Moje zadania”)
  db.my_tasks.length = 0;
  [
    ['Zadzwonić do księgowej w sprawie rozliczenia', 0, false], ['Zamówić próbki tkanin do nowej kolekcji', -2, false],
    ['Przygotować ofertę dla klienta z Norwegii', 1, false], ['Umówić przegląd samochodu dostawczego', 3, false],
    ['Odnowić ubezpieczenie magazynu', 7, false], ['Wysłać fakturę za zamówienie sezonowe', -1, true]
  ].forEach(([title, off, done]) => db.my_tasks.push({ id: crypto.randomUUID(), title, due_date: ymd(off), done, done_at: done ? ts(-1, 15) : null, created_at: ts(-6, 9), updated_at: ts(-1, 15) }));

  let aid = 0;
  const log = (action, by, off, h, changes) => db.audit_log.push({ id: ++aid, table_name: 'inquiries', record_id: id('a', 41), action, changed_by: by, changed_at: ts(off, h), changes: changes || {} });
  log('insert', 'Marek', -6, 10);
  log('update', 'Kasia', -4, 14, { next_step: ['Wysłać rysunki wstępne.', 'Czekamy na wybór tkaniny.'] });
  log('update', 'Marek', -2, 9, { next_step: ['Czekamy na wybór tkaniny.', 'Wysłać wycenę do końca tygodnia.'], due_date: [null, ymd(-2)] });
  log('update', 'Marek', -1, 16, { status: ['followup', 'action'] });
  // dla okienka „Co nowego” (punkt odniesienia ustawiony w demo.html na 5 dni wstecz)
  const logFor = (n, action, by, off, h, changes) => db.audit_log.push({ id: ++aid, table_name: 'inquiries', record_id: id('a', n), action, changed_by: by, changed_at: ts(off, h), changes: changes || {} });
  logFor(46, 'insert', 'Kasia', -1, 15);
  logFor(41, 'update', 'Kasia', -1, 12, { next_step: ['Wysłać wycenę do końca tygodnia.', 'Wysłać wycenę do końca tygodnia. Dopytać o kolor tkaniny.'] });
  logFor(37, 'update', 'Marek', -2, 10, { next_step: ['Czekamy na decyzję.', 'Czekamy na decyzję o zamówieniu serii.'] });
  note(43, 2, 3, 'call', 'Klient potwierdził termin dostawy.', 'Kasia', -1, 11);
})();
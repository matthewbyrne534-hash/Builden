// src/data/store.js
import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  currentJobId: null,
  recentJobIds: [],
  jobs: [
    {
      id: 'j1', num: '261047', name: 'Riverside Trade School', address: '142 Commerce Drive', city: 'Albany', state: 'NY', zip: '12205',
      gc: 'Apex Construction Group', owner: 'Riverside School District', ae: 'Davies & Holt Architecture',
      supers: [{ id: 's1', name: 'R. Kowalski', email: 'rkowalski@apexcg.com', phone: '(215) 555-0134' }],
      classifications: [{ id: 'c1', name: 'Foreman', regRate: 95, otRate: 142.50, dtRate: 190 }, { id: 'c2', name: 'Electrician', regRate: 75, otRate: 112.50, dtRate: 150 }, { id: 'c3', name: 'Laborer', regRate: 55, otRate: 82.50, dtRate: 110 }],
      workers: [{ id: 'w1', first: 'Mike', last: 'Torres', classId: 'c1' }, { id: 'w2', first: 'Dan', last: 'Reyes', classId: 'c2' }],
      members: [],
      packages: [
        { id: 'p1', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Power to BAS control panel - Mech Room 1', authType: 'Change Event', authRef: 'CE-047', authFileName: null, prepSettings: null,
          tickets: [{ id: 't1', num: 'TM-001.1', date: '2026-03-10', desc: 'Ran conduit from panel room to BAS unit location.', labor: [{ id: 'l1', workerId: 'w1', workerName: 'Mike Torres', classId: 'c1', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 95, otRate: 142.50, dtRate: 190 }], materials: [], vendors: [], photos: [], foremanId: 'w1', foremanName: 'Mike Torres', superId: 's1', superName: 'R. Kowalski', status: 'draft' }] },
        { id: 'p2', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Additional conduit runs - Level 3', authType: 'RFI Response', authRef: 'RFI-022', authFileName: null, prepSettings: null,
          tickets: [{ id: 't2', num: 'TM-002.1', date: '2026-03-12', desc: 'Installed additional conduit runs per RFI-022.', labor: [{ id: 'l2', workerId: 'w2', workerName: 'Dan Reyes', classId: 'c2', className: 'Electrician', reg: 8, ot: 2, dt: 0, regRate: 75, otRate: 112.50, dtRate: 150 }], materials: [], vendors: [], photos: [], foremanId: 'w2', foremanName: 'Dan Reyes', superId: 's1', superName: 'R. Kowalski', status: 'pending-sig' }] }
      ]
    },
    {
      id: 'j2', num: '261089', name: 'Harbor View Office Complex', address: '500 Harbor Blvd', city: 'Troy', state: 'NY', zip: '12180',
      gc: 'Summit GC Partners', owner: 'Harbor Realty LLC', ae: 'Smith Engineering',
      supers: [{ id: 's2', name: 'J. Martinez', email: 'jmartinez@summitgc.com', phone: '(518) 555-0221' }],
      classifications: [{ id: 'c4', name: 'Foreman', regRate: 98, otRate: 147, dtRate: 196 }, { id: 'c5', name: 'Plumber', regRate: 78, otRate: 117, dtRate: 156 }],
      workers: [{ id: 'w3', first: 'Carlos', last: 'Rivera', classId: 'c4' }, { id: 'w4', first: 'Tom', last: 'Brady', classId: 'c5' }],
      members: [],
      packages: [
        { id: 'p3', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Reroute drain lines Level 2', authType: 'Field Work Order', authRef: 'FWO-011', authFileName: null, prepSettings: null,
          tickets: [{ id: 't3', num: 'TM-001.1', date: '2026-03-08', desc: 'Rerouted drain lines per architect field directive.', labor: [{ id: 'l3', workerId: 'w3', workerName: 'Carlos Rivera', classId: 'c4', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 98, otRate: 147, dtRate: 196 }], materials: [], vendors: [], photos: [], foremanId: 'w3', foremanName: 'Carlos Rivera', superId: 's2', superName: 'J. Martinez', status: 'draft' }] },
        { id: 'p4', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Domestic water connection - Suite 400', authType: 'Authorization Email', authRef: '', authFileName: null, prepSettings: null,
          tickets: [{ id: 't4', num: 'TM-002.1', date: '2026-03-14', desc: 'Connected domestic water to new tenant suite.', labor: [{ id: 'l4', workerId: 'w4', workerName: 'Tom Brady', classId: 'c5', className: 'Plumber', reg: 6, ot: 0, dt: 0, regRate: 78, otRate: 117, dtRate: 156 }], materials: [], vendors: [], photos: [], foremanId: 'w4', foremanName: 'Tom Brady', superId: 's2', superName: 'J. Martinez', status: 'draft' }] }
      ]
    },
    {
      id: 'j3', num: '261134', name: 'Northside Medical Center', address: '88 Medical Park Dr', city: 'Schenectady', state: 'NY', zip: '12304',
      gc: 'Meridian Builders', owner: 'Northside Health System', ae: 'Cannon Design',
      supers: [{ id: 's3', name: 'B. Walsh', email: 'bwalsh@meridian.com', phone: '(518) 555-0310' }],
      classifications: [{ id: 'c6', name: 'Foreman', regRate: 100, otRate: 150, dtRate: 200 }, { id: 'c7', name: 'HVAC Tech', regRate: 82, otRate: 123, dtRate: 164 }],
      workers: [{ id: 'w5', first: 'Steve', last: 'McKenna', classId: 'c6' }, { id: 'w6', first: 'Lisa', last: 'Chen', classId: 'c7' }],
      members: [],
      packages: [
        { id: 'p5', num: 'TM-001', numSystem: 'TM-{seq}', title: 'VAV box replacement - Wing C', authType: 'Change Event', authRef: 'CE-012', authFileName: null, prepSettings: null,
          tickets: [{ id: 't5', num: 'TM-001.1', date: '2026-03-05', desc: 'Removed and replaced VAV boxes in Wing C corridor.', labor: [{ id: 'l5', workerId: 'w5', workerName: 'Steve McKenna', classId: 'c6', className: 'Foreman', reg: 8, ot: 4, dt: 0, regRate: 100, otRate: 150, dtRate: 200 }], materials: [], vendors: [], photos: [], foremanId: 'w5', foremanName: 'Steve McKenna', superId: 's3', superName: 'B. Walsh', status: 'pending-sig' }] },
        { id: 'p6', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Exhaust fan installation - OR Suite 2', authType: 'Revised Drawing', authRef: 'RD-004', authFileName: null, prepSettings: null,
          tickets: [{ id: 't6', num: 'TM-002.1', date: '2026-03-11', desc: 'Installed exhaust fan per revised mechanical drawings.', labor: [{ id: 'l6', workerId: 'w6', workerName: 'Lisa Chen', classId: 'c7', className: 'HVAC Tech', reg: 6, ot: 0, dt: 0, regRate: 82, otRate: 123, dtRate: 164 }], materials: [], vendors: [], photos: [], foremanId: 'w6', foremanName: 'Lisa Chen', superId: 's3', superName: 'B. Walsh', status: 'draft' }] }
      ]
    },
    {
      id: 'j4', num: '261201', name: 'Downtown Hotel Renovation', address: '1 State Street', city: 'Albany', state: 'NY', zip: '12207',
      gc: 'Northeast Contracting', owner: 'Capitol Hotel Group', ae: 'LaBella Associates',
      supers: [{ id: 's4', name: 'P. Sullivan', email: 'psullivan@nec.com', phone: '(518) 555-0445' }],
      classifications: [{ id: 'c8', name: 'Foreman', regRate: 95, otRate: 142.50, dtRate: 190 }, { id: 'c9', name: 'Electrician', regRate: 76, otRate: 114, dtRate: 152 }],
      workers: [{ id: 'w7', first: 'Ray', last: 'Diaz', classId: 'c8' }, { id: 'w8', first: 'Pat', last: 'OBrien', classId: 'c9' }],
      members: [],
      packages: [
        { id: 'p7', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Guestroom lighting upgrade - Floors 3-5', authType: 'Authorization Email', authRef: '', authFileName: null, prepSettings: null,
          tickets: [{ id: 't7', num: 'TM-001.1', date: '2026-03-09', desc: 'Replaced lighting fixtures in guestrooms floors 3 through 5.', labor: [{ id: 'l7', workerId: 'w7', workerName: 'Ray Diaz', classId: 'c8', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 95, otRate: 142.50, dtRate: 190 }], materials: [], vendors: [], photos: [], foremanId: 'w7', foremanName: 'Ray Diaz', superId: 's4', superName: 'P. Sullivan', status: 'draft' }] },
        { id: 'p8', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Emergency generator connection', authType: 'Change Event', authRef: 'CE-031', authFileName: null, prepSettings: null,
          tickets: [{ id: 't8', num: 'TM-002.1', date: '2026-03-15', desc: 'Connected emergency generator to main electrical panel.', labor: [{ id: 'l8', workerId: 'w8', workerName: 'Pat OBrien', classId: 'c9', className: 'Electrician', reg: 10, ot: 2, dt: 0, regRate: 76, otRate: 114, dtRate: 152 }], materials: [], vendors: [], photos: [], foremanId: 'w8', foremanName: 'Pat OBrien', superId: 's4', superName: 'P. Sullivan', status: 'pending-sig' }] }
      ]
    },
    {
      id: 'j5', num: '261256', name: 'Saratoga Springs Library', address: '49 Henry Street', city: 'Saratoga Springs', state: 'NY', zip: '12866',
      gc: 'Hayner Hoyt Corp', owner: 'City of Saratoga Springs', ae: 'Architectural Resources',
      supers: [{ id: 's5', name: 'D. Kowalczyk', email: 'dkowalczyk@hayner.com', phone: '(518) 555-0512' }],
      classifications: [{ id: 'c10', name: 'Foreman', regRate: 92, otRate: 138, dtRate: 184 }, { id: 'c11', name: 'Plumber', regRate: 74, otRate: 111, dtRate: 148 }],
      workers: [{ id: 'w9', first: 'Frank', last: 'Russo', classId: 'c10' }, { id: 'w10', first: 'Amy', last: 'Park', classId: 'c11' }],
      members: [],
      packages: [
        { id: 'p9', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Restroom plumbing modifications', authType: 'Sketch or Bulletin', authRef: 'SK-007', authFileName: null, prepSettings: null,
          tickets: [{ id: 't9', num: 'TM-001.1', date: '2026-03-06', desc: 'Modified restroom rough-in per architect sketch.', labor: [{ id: 'l9', workerId: 'w9', workerName: 'Frank Russo', classId: 'c10', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 92, otRate: 138, dtRate: 184 }], materials: [], vendors: [], photos: [], foremanId: 'w9', foremanName: 'Frank Russo', superId: 's5', superName: 'D. Kowalczyk', status: 'draft' }] },
        { id: 'p10', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Floor drain addition - Stack Room', authType: 'Meeting Minutes Directing the Work', authRef: 'MM-003', authFileName: null, prepSettings: null,
          tickets: [{ id: 't10', num: 'TM-002.1', date: '2026-03-13', desc: 'Added floor drain to stack room per meeting minutes directive.', labor: [{ id: 'l10', workerId: 'w10', workerName: 'Amy Park', classId: 'c11', className: 'Plumber', reg: 5, ot: 0, dt: 0, regRate: 74, otRate: 111, dtRate: 148 }], materials: [], vendors: [], photos: [], foremanId: 'w10', foremanName: 'Amy Park', superId: 's5', superName: 'D. Kowalczyk', status: 'draft' }] }
      ]
    },
    {
      id: 'j6', num: '261312', name: 'Colonie Center Mall Expansion', address: '131 Colonie Center', city: 'Albany', state: 'NY', zip: '12205',
      gc: 'BBL Construction', owner: 'Colonie Center LLC', ae: 'Bergmann Associates',
      supers: [{ id: 's6', name: 'T. Flanagan', email: 'tflanagan@bbl.com', phone: '(518) 555-0601' }],
      classifications: [{ id: 'c12', name: 'Foreman', regRate: 97, otRate: 145.50, dtRate: 194 }, { id: 'c13', name: 'Electrician', regRate: 79, otRate: 118.50, dtRate: 158 }],
      workers: [{ id: 'w11', first: 'Joe', last: 'Martino', classId: 'c12' }, { id: 'w12', first: 'Sara', last: 'Voss', classId: 'c13' }],
      members: [],
      packages: [
        { id: 'p11', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Tenant fit-out electrical - Unit 114', authType: 'Notice to Proceed on T&M Basis', authRef: 'NTP-005', authFileName: null, prepSettings: null,
          tickets: [{ id: 't11', num: 'TM-001.1', date: '2026-03-07', desc: 'Completed electrical rough-in for new tenant unit 114.', labor: [{ id: 'l11', workerId: 'w11', workerName: 'Joe Martino', classId: 'c12', className: 'Foreman', reg: 8, ot: 2, dt: 0, regRate: 97, otRate: 145.50, dtRate: 194 }], materials: [], vendors: [], photos: [], foremanId: 'w11', foremanName: 'Joe Martino', superId: 's6', superName: 'T. Flanagan', status: 'pending-sig' }] },
        { id: 'p12', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Common area lighting controls upgrade', authType: 'Change Event', authRef: 'CE-019', authFileName: null, prepSettings: null,
          tickets: [{ id: 't12', num: 'TM-002.1', date: '2026-03-16', desc: 'Upgraded lighting controls in common area corridors.', labor: [{ id: 'l12', workerId: 'w12', workerName: 'Sara Voss', classId: 'c13', className: 'Electrician', reg: 7, ot: 0, dt: 0, regRate: 79, otRate: 118.50, dtRate: 158 }], materials: [], vendors: [], photos: [], foremanId: 'w12', foremanName: 'Sara Voss', superId: 's6', superName: 'T. Flanagan', status: 'draft' }] }
      ]
    },
    {
      id: 'j7', num: '261378', name: 'RPI Engineering Building', address: '110 8th Street', city: 'Troy', state: 'NY', zip: '12180',
      gc: 'Turner Construction', owner: 'Rensselaer Polytechnic Institute', ae: 'Einhorn Yaffee',
      supers: [{ id: 's7', name: 'M. Russo', email: 'mrusso@turner.com', phone: '(518) 555-0712' }],
      classifications: [{ id: 'c14', name: 'Foreman', regRate: 102, otRate: 153, dtRate: 204 }, { id: 'c15', name: 'HVAC Tech', regRate: 84, otRate: 126, dtRate: 168 }],
      workers: [{ id: 'w13', first: 'Dave', last: 'Hoffman', classId: 'c14' }, { id: 'w14', first: 'Jen', last: 'Torres', classId: 'c15' }],
      members: [],
      packages: [
        { id: 'p13', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Lab fume hood ductwork modification', authType: 'Design Team Clarification', authRef: 'DTC-008', authFileName: null, prepSettings: null,
          tickets: [{ id: 't13', num: 'TM-001.1', date: '2026-03-04', desc: 'Modified fume hood ductwork per design team clarification.', labor: [{ id: 'l13', workerId: 'w13', workerName: 'Dave Hoffman', classId: 'c14', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 102, otRate: 153, dtRate: 204 }], materials: [], vendors: [], photos: [], foremanId: 'w13', foremanName: 'Dave Hoffman', superId: 's7', superName: 'M. Russo', status: 'draft' }] },
        { id: 'p14', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Chilled water pipe reroute - Basement', authType: 'RFI Response', authRef: 'RFI-014', authFileName: null, prepSettings: null,
          tickets: [{ id: 't14', num: 'TM-002.1', date: '2026-03-10', desc: 'Rerouted chilled water piping in basement mechanical room.', labor: [{ id: 'l14', workerId: 'w14', workerName: 'Jen Torres', classId: 'c15', className: 'HVAC Tech', reg: 10, ot: 3, dt: 0, regRate: 84, otRate: 126, dtRate: 168 }], materials: [], vendors: [], photos: [], foremanId: 'w14', foremanName: 'Jen Torres', superId: 's7', superName: 'M. Russo', status: 'pending-sig' }] }
      ]
    },
    {
      id: 'j8', num: '261445', name: 'Latham Farms Shopping Center', address: '579 Troy-Schenectady Rd', city: 'Latham', state: 'NY', zip: '12110',
      gc: 'Clough Harbour', owner: 'Latham Retail Partners', ae: 'MJ Engineering',
      supers: [{ id: 's8', name: 'K. Brennan', email: 'kbrennan@clough.com', phone: '(518) 555-0823' }],
      classifications: [{ id: 'c16', name: 'Foreman', regRate: 93, otRate: 139.50, dtRate: 186 }, { id: 'c17', name: 'Plumber', regRate: 72, otRate: 108, dtRate: 144 }],
      workers: [{ id: 'w15', first: 'Nick', last: 'Caruso', classId: 'c16' }, { id: 'w16', first: 'Beth', last: 'Moore', classId: 'c17' }],
      members: [],
      packages: [
        { id: 'p15', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Grease trap installation - Food court', authType: 'Emergency Work Authorization', authRef: 'EWA-002', authFileName: null, prepSettings: null,
          tickets: [{ id: 't15', num: 'TM-001.1', date: '2026-03-11', desc: 'Installed grease trap per emergency work authorization.', labor: [{ id: 'l15', workerId: 'w15', workerName: 'Nick Caruso', classId: 'c16', className: 'Foreman', reg: 8, ot: 4, dt: 0, regRate: 93, otRate: 139.50, dtRate: 186 }], materials: [], vendors: [], photos: [], foremanId: 'w15', foremanName: 'Nick Caruso', superId: 's8', superName: 'K. Brennan', status: 'draft' }] },
        { id: 'p16', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Roof drain reroute - Anchor tenant', authType: 'Sketch or Bulletin', authRef: 'SK-003', authFileName: null, prepSettings: null,
          tickets: [{ id: 't16', num: 'TM-002.1', date: '2026-03-17', desc: 'Rerouted roof drain piping for anchor tenant buildout.', labor: [{ id: 'l16', workerId: 'w16', workerName: 'Beth Moore', classId: 'c17', className: 'Plumber', reg: 6, ot: 0, dt: 0, regRate: 72, otRate: 108, dtRate: 144 }], materials: [], vendors: [], photos: [], foremanId: 'w16', foremanName: 'Beth Moore', superId: 's8', superName: 'K. Brennan', status: 'pending-sig' }] }
      ]
    },
    {
      id: 'j9', num: '261501', name: 'Cohoes Falls Apartment Complex', address: '1 Remsen Street', city: 'Cohoes', state: 'NY', zip: '12047',
      gc: 'Christa Construction', owner: 'Cohoes Falls Development LLC', ae: 'SWBR Architects',
      supers: [{ id: 's9', name: 'G. Petrie', email: 'gpetrie@christa.com', phone: '(518) 555-0934' }],
      classifications: [{ id: 'c18', name: 'Foreman', regRate: 90, otRate: 135, dtRate: 180 }, { id: 'c19', name: 'Electrician', regRate: 73, otRate: 109.50, dtRate: 146 }],
      workers: [{ id: 'w17', first: 'Mark', last: 'Ellis', classId: 'c18' }, { id: 'w18', first: 'Tina', last: 'Shaw', classId: 'c19' }],
      members: [],
      packages: [
        { id: 'p17', num: 'TM-001', numSystem: 'TM-{seq}', title: 'Common area electrical panel upgrade', authType: 'Change Event', authRef: 'CE-044', authFileName: null, prepSettings: null,
          tickets: [{ id: 't17', num: 'TM-001.1', date: '2026-03-08', desc: 'Upgraded electrical panels in common areas floors 1-3.', labor: [{ id: 'l17', workerId: 'w17', workerName: 'Mark Ellis', classId: 'c18', className: 'Foreman', reg: 8, ot: 0, dt: 0, regRate: 90, otRate: 135, dtRate: 180 }], materials: [], vendors: [], photos: [], foremanId: 'w17', foremanName: 'Mark Ellis', superId: 's9', superName: 'G. Petrie', status: 'draft' }] },
        { id: 'p18', num: 'TM-002', numSystem: 'TM-{seq}', title: 'EV charging station rough-in', authType: 'Authorization Email', authRef: '', authFileName: null, prepSettings: null,
          tickets: [{ id: 't18', num: 'TM-002.1', date: '2026-03-14', desc: 'Rough-in for EV charging stations in parking garage.', labor: [{ id: 'l18', workerId: 'w18', workerName: 'Tina Shaw', classId: 'c19', className: 'Electrician', reg: 7, ot: 2, dt: 0, regRate: 73, otRate: 109.50, dtRate: 146 }], materials: [], vendors: [], photos: [], foremanId: 'w18', foremanName: 'Tina Shaw', superId: 's9', superName: 'G. Petrie', status: 'pending-sig' }] }
      ]
    },
    {
      id: 'j10', num: '261567', name: 'Watervliet Arsenal Modernization', address: '1 Buffington Street', city: 'Watervliet', state: 'NY', zip: '12189',
      gc: 'C&S Companies', owner: 'US Army Corps of Engineers', ae: 'Wendel Companies',
      supers: [{ id: 's10', name: 'R. MacPherson', email: 'rmacpherson@cs.com', phone: '(518) 555-1045' }],
      classifications: [{ id: 'c20', name: 'Foreman', regRate: 105, otRate: 157.50, dtRate: 210 }, { id: 'c21', name: 'HVAC Tech', regRate: 86, otRate: 129, dtRate: 172 }],
      workers: [{ id: 'w19', first: 'Chris', last: 'Dolan', classId: 'c20' }, { id: 'w20', first: 'Dana', last: 'Webb', classId: 'c21' }],
      members: [],
      packages: [
        { id: 'p19', num: 'TM-001', numSystem: 'TM-{seq}', title: 'HVAC controls upgrade - Building 10', authType: 'Change Event', authRef: 'CE-067', authFileName: null, prepSettings: null,
          tickets: [{ id: 't19', num: 'TM-001.1', date: '2026-03-03', desc: 'Upgraded HVAC controls in Building 10 manufacturing area.', labor: [{ id: 'l19', workerId: 'w19', workerName: 'Chris Dolan', classId: 'c20', className: 'Foreman', reg: 8, ot: 4, dt: 0, regRate: 105, otRate: 157.50, dtRate: 210 }], materials: [], vendors: [], photos: [], foremanId: 'w19', foremanName: 'Chris Dolan', superId: 's10', superName: 'R. MacPherson', status: 'pending-sig' }] },
        { id: 'p20', num: 'TM-002', numSystem: 'TM-{seq}', title: 'Exhaust system modification - Forge area', authType: 'Revised Drawing', authRef: 'RD-009', authFileName: null, prepSettings: null,
          tickets: [{ id: 't20', num: 'TM-002.1', date: '2026-03-12', desc: 'Modified exhaust system per revised mechanical drawings in forge area.', labor: [{ id: 'l20', workerId: 'w20', workerName: 'Dana Webb', classId: 'c21', className: 'HVAC Tech', reg: 9, ot: 2, dt: 0, regRate: 86, otRate: 129, dtRate: 172 }], materials: [], vendors: [], photos: [], foremanId: 'w20', foremanName: 'Dana Webb', superId: 's10', superName: 'R. MacPherson', status: 'draft' }] }
      ]
    }
  ],
  directory: {
    companies: [
      { id: 'co1', name: 'Apex Construction Group', phone: '(518) 555-0100', email: 'info@apexcg.com', address: '1200 Market St, Albany, NY 12205' },
      { id: 'co2', name: 'Summit GC Partners', phone: '(518) 555-0200', email: 'info@summitgc.com', address: '450 N 3rd St, Troy, NY 12180' },
      { id: 'co3', name: 'Meridian Builders', phone: '(518) 555-0300', email: 'info@meridian.com', address: '88 Wolf Rd, Albany, NY 12205' }
    ],
    contacts: [
      { id: 'ct1', companyId: 'co1', first: 'R.', last: 'Kowalski', title: 'Superintendent', phone: '(518) 555-0134', email: 'rkowalski@apexcg.com' },
      { id: 'ct2', companyId: 'co2', first: 'J.', last: 'Martinez', title: 'Superintendent', phone: '(518) 555-0221', email: 'jmartinez@summitgc.com' },
      { id: 'ct3', companyId: 'co3', first: 'B.', last: 'Walsh', title: 'Superintendent', phone: '(518) 555-0310', email: 'bwalsh@meridian.com' }
    ]
  },
  profile: { name: 'Your Company Name', address: '123 Main Street', city: 'City, State 00000', phone: '(555) 000-0000', logo: null }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_JOB': return { ...state, currentJobId: action.id, recentJobIds: [action.id, ...state.recentJobIds.filter(id => id !== action.id)].slice(0, 5) };
    case 'ADD_JOB': return { ...state, jobs: [...state.jobs, action.job] };
    case 'UPDATE_JOB': return { ...state, jobs: state.jobs.map(j => j.id === action.id ? { ...j, ...action.data } : j) };
    case 'DELETE_JOB': return { ...state, jobs: state.jobs.filter(j => j.id !== action.id) };
    case 'ADD_SUPER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, supers: [...j.supers, action.sup] } : j) };
    case 'REMOVE_SUPER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, supers: j.supers.filter(s => s.id !== action.supId) } : j) };
    case 'ADD_CLS': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: [...j.classifications, action.cls] } : j) };
    case 'UPDATE_CLS': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: j.classifications.map(c => c.id === action.cls.id ? action.cls : c) } : j) };
    case 'REMOVE_CLS': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, classifications: j.classifications.filter(c => c.id !== action.clsId) } : j) };
    case 'ADD_WORKER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: [...j.workers, action.worker] } : j) };
    case 'UPDATE_WORKER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: j.workers.map(w => w.id === action.worker.id ? action.worker : w) } : j) };
    case 'REMOVE_WORKER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, workers: j.workers.filter(w => w.id !== action.workerId) } : j) };
    case 'ADD_JOB_MEMBER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, members: [...(j.members || []), action.member] } : j) };
    case 'REMOVE_JOB_MEMBER': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, members: (j.members || []).filter(m => m.id !== action.memberId) } : j) };
    case 'ADD_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: [...j.packages, action.pkg] } : j) };
    case 'UPDATE_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, ...action.data } : p) } : j) };
    case 'DELETE_PKG': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.filter(p => p.id !== action.pkgId) } : j) };
    case 'ADD_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: [...p.tickets, action.ticket] } : p) } : j) };
    case 'UPDATE_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.map(t => t.id === action.ticketId ? { ...t, ...action.data } : t) } : p) } : j) };
    case 'DELETE_TICKET': return { ...state, jobs: state.jobs.map(j => j.id === action.jobId ? { ...j, packages: j.packages.map(p => p.id === action.pkgId ? { ...p, tickets: p.tickets.filter(t => t.id !== action.ticketId) } : p) } : j) };
    case 'ADD_COMPANY': return { ...state, directory: { ...state.directory, companies: [...state.directory.companies, action.company] } };
    case 'UPDATE_COMPANY': return { ...state, directory: { ...state.directory, companies: state.directory.companies.map(c => c.id === action.company.id ? action.company : c) } };
    case 'DELETE_COMPANY': return { ...state, directory: { ...state.directory, companies: state.directory.companies.filter(c => c.id !== action.id), contacts: state.directory.contacts.filter(c => c.companyId !== action.id) } };
    case 'ADD_CONTACT': return { ...state, directory: { ...state.directory, contacts: [...state.directory.contacts, action.contact] } };
    case 'UPDATE_CONTACT': return { ...state, directory: { ...state.directory, contacts: state.directory.contacts.map(c => c.id === action.contact.id ? action.contact : c) } };
    case 'DELETE_CONTACT': return { ...state, directory: { ...state.directory, contacts: state.directory.contacts.filter(c => c.id !== action.id) } };
    default: return state;
  }
}

const Ctx = createContext(null);
export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}
export function useStore() { return useContext(Ctx); }

// Lightweight, dependency-free smoke tests for the partner-login fix.
//
// We re-implement the `findPartnerByInput` contract and the login decision
// tree from ContractorModule.handleLogin against a stubbed "Firestore"
// surface, to lock in the post-fix behavior:
//
//   1. Happy path           -> { status: 'found', partner }    -> session created
//   2. Wrong access code    -> found partner, code mismatch    -> "Código de Acesso inválido"
//   3. Deactivated partner  -> found partner, active === false -> "acesso ... bloqueado"
//   4. Unknown company      -> { status: 'not_found' }         -> "Empresa não encontrada"
//   5. Network error        -> { status: 'network_error' }     -> "Falha de conexão"
//
// These mirror the actual code paths in:
//   - services/dataService.ts          (findPartnerByInput)
//   - modules/ContractorModule.tsx     (ContractorLogin.handleLogin)
//   - pages/ContractorDashboard.tsx    (verifyPartner — non-destructive)

import assert from 'node:assert/strict';
import test from 'node:test';

// --- Helpers replicated from services/dataService.ts -------------------------

const normalizeString = (str) =>
  (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .trim();

const partnerSlug = (name) => normalizeString(name).toLowerCase();

const partnerMatchesInput = (p, normalizedInput) => {
  if (!normalizedInput) return false;
  const idNorm = (p.id || '').toLowerCase();
  const nameNorm = normalizeString(p.name || '').toLowerCase();
  return idNorm === normalizedInput || nameNorm === normalizedInput;
};

// Test-only Firestore stub: hands back partner/campaign docs from in-memory
// fixtures, optionally throwing a network error to simulate an outage.
function makeFirestoreStub({ partners = {}, campaigns = [], failGet = false, failListCampaigns = false } = {}) {
  return {
    getDoc: async (path) => {
      if (failGet) throw new Error('simulated network failure');
      const [, collection, id] = path.split('/');
      if (collection === 'partners') {
        const data = partners[id];
        return data ? { exists: () => true, id, data: () => data } : { exists: () => false };
      }
      return { exists: () => false };
    },
    getDocs: async (collection) => {
      if (collection === 'campaigns') {
        if (failListCampaigns) throw new Error('simulated list failure');
        return {
          forEach: (fn) => campaigns.forEach((c) => fn({ id: c.id, data: () => c }))
        };
      }
      // partners list is denied by Firestore rules for non-admin -> simulate
      // a permission-denied error if anyone is tempted to call it.
      throw new Error('permission-denied: partners.list is not allowed');
    }
  };
}

// Direct port of findPartnerByInput for tests (same control flow as prod).
async function findPartnerByInput(rawInput, { firestore, localPartners = [], localCampaigns = [] }) {
  const normalizedInput = partnerSlug(rawInput || '');
  if (!normalizedInput) return { status: 'not_found' };

  const localHit = localPartners.find((p) => partnerMatchesInput(p, normalizedInput));
  if (localHit) return { status: 'found', partner: localHit };

  let sawNetworkError = false;

  try {
    const snap = await firestore.getDoc(`/partners/${normalizedInput}`);
    if (snap.exists()) {
      return { status: 'found', partner: { id: snap.id, ...snap.data() } };
    }
  } catch (e) {
    sawNetworkError = true;
  }

  const candidates = new Set();
  const collectFromCampaigns = (campaigns) => {
    campaigns.forEach((c) => {
      const partnerNorm = c.partner ? normalizeString(c.partner) : '';
      const contractorNorm = c.contractor ? normalizeString(c.contractor) : '';
      const inputUpper = normalizedInput.toUpperCase();
      const matchesPartner =
        partnerNorm &&
        (partnerNorm === inputUpper || partnerNorm.includes(inputUpper) || inputUpper.includes(partnerNorm));
      const matchesContractor =
        contractorNorm &&
        (contractorNorm === inputUpper || contractorNorm.includes(inputUpper) || inputUpper.includes(contractorNorm));
      if (matchesPartner && c.partner) candidates.add(partnerSlug(c.partner));
      if (matchesContractor && c.contractor) candidates.add(partnerSlug(c.contractor));
    });
  };

  collectFromCampaigns(localCampaigns);

  if (candidates.size === 0) {
    try {
      const snap = await firestore.getDocs('campaigns');
      const remote = [];
      snap.forEach((d) => remote.push({ id: d.id, ...d.data() }));
      collectFromCampaigns(remote);
    } catch (e) {
      sawNetworkError = true;
    }
  }

  candidates.delete(normalizedInput);

  for (const slug of candidates) {
    try {
      const snap = await firestore.getDoc(`/partners/${slug}`);
      if (snap.exists()) {
        return { status: 'found', partner: { id: snap.id, ...snap.data() } };
      }
    } catch (e) {
      sawNetworkError = true;
    }
  }

  if (sawNetworkError) return { status: 'network_error', error: 'firestore' };
  return { status: 'not_found' };
}

// Direct port of the login decision tree (the part below findPartnerByInput).
function decideLogin(result, typedCode) {
  if (result.status === 'network_error') return { ok: false, message: 'Falha de conexão. Verifique sua internet e tente novamente.' };
  if (result.status === 'not_found') return { ok: false, message: 'Empresa não encontrada. Confira o nome cadastrado.' };

  const partner = result.partner;
  const cleanSaved = normalizeString(partner.accessCode || '');
  const cleanTyped = normalizeString(typedCode);

  if (!cleanSaved) return { ok: false, message: 'Esta empresa não possui código de acesso configurado. Contate o administrador.' };
  if (cleanSaved !== cleanTyped) return { ok: false, message: 'Código de Acesso inválido.' };
  if (!partner.active) return { ok: false, message: 'O acesso para esta empresa está temporariamente bloqueado.' };

  return { ok: true, partner };
}

// Direct port of the dashboard verifyPartner decision (non-destructive).
function decideSession(refreshResult) {
  if (refreshResult.status === 'found') {
    return refreshResult.partner.active === false ? { keepSession: false, reason: 'revoked' } : { keepSession: true };
  }
  // not_found or network_error -> always keep the session alive.
  return { keepSession: true, transient: true };
}

// ---------------------------------------------------------------------------
// Tests

test('happy path: exact slug match in Firestore logs the partner in', async () => {
  const firestore = makeFirestoreStub({
    partners: { fiat: { name: 'Fiat', accessCode: 'FIAT2026', active: true } }
  });
  const result = await findPartnerByInput('Fiat', { firestore });
  assert.equal(result.status, 'found');
  const decision = decideLogin(result, 'FIAT2026');
  assert.equal(decision.ok, true);
  assert.equal(decision.partner.name, 'Fiat');
});

test('happy path: case-insensitive + punctuation-tolerant company name', async () => {
  const firestore = makeFirestoreStub({
    partners: { uol: { name: 'UOL', accessCode: 'UOL123', active: true } }
  });
  const result = await findPartnerByInput('  uol  ', { firestore });
  assert.equal(result.status, 'found');
  assert.equal(decideLogin(result, 'uol123').ok, true);
});

test('fuzzy: name with punctuation resolves via campaign-based fallback', async () => {
  const firestore = makeFirestoreStub({
    partners: { fiatsa: { name: 'Fiat S.A.', accessCode: 'FIAT2026', active: true } },
    campaigns: [{ id: 'camp1', partner: 'Restaurantes Parceiros', contractor: 'Fiat S.A.' }]
  });
  // User types "Fiat" -> slug "fiat" -> direct getDoc misses
  // -> campaign matching produces slug "fiatsa" -> getDoc finds the partner.
  const result = await findPartnerByInput('Fiat', { firestore });
  assert.equal(result.status, 'found');
  assert.equal(result.partner.id, 'fiatsa');
});

test('wrong access code returns "Código de Acesso inválido"', async () => {
  const firestore = makeFirestoreStub({
    partners: { fiat: { name: 'Fiat', accessCode: 'FIAT2026', active: true } }
  });
  const result = await findPartnerByInput('Fiat', { firestore });
  const decision = decideLogin(result, 'wrong');
  assert.equal(decision.ok, false);
  assert.match(decision.message, /Código de Acesso inválido/);
});

test('deactivated partner is blocked with a clear message', async () => {
  const firestore = makeFirestoreStub({
    partners: { fiat: { name: 'Fiat', accessCode: 'FIAT2026', active: false } }
  });
  const result = await findPartnerByInput('Fiat', { firestore });
  const decision = decideLogin(result, 'FIAT2026');
  assert.equal(decision.ok, false);
  assert.match(decision.message, /bloqueado/);
});

test('unknown company name returns not_found (no false network error)', async () => {
  const firestore = makeFirestoreStub({ partners: {}, campaigns: [] });
  const result = await findPartnerByInput('EmpresaInexistente', { firestore });
  assert.equal(result.status, 'not_found');
  const decision = decideLogin(result, 'whatever');
  assert.match(decision.message, /Empresa não encontrada/);
});

test('Firestore outage maps to network_error, never to "not_found"', async () => {
  const firestore = makeFirestoreStub({ failGet: true, failListCampaigns: true });
  const result = await findPartnerByInput('Fiat', { firestore });
  assert.equal(result.status, 'network_error');
  const decision = decideLogin(result, 'FIAT2026');
  assert.match(decision.message, /Falha de conexão/);
});

test('session check: keeps session alive on transient network_error', () => {
  const decision = decideSession({ status: 'network_error', error: 'x' });
  assert.equal(decision.keepSession, true);
  assert.equal(decision.transient, true);
});

test('session check: keeps session alive on not_found (e.g. partner missing in this device cache)', () => {
  const decision = decideSession({ status: 'not_found' });
  assert.equal(decision.keepSession, true);
});

test('session check: only revokes session on explicit active === false from Firestore', () => {
  const active = decideSession({ status: 'found', partner: { active: true } });
  assert.equal(active.keepSession, true);

  const undef = decideSession({ status: 'found', partner: {} });
  assert.equal(undef.keepSession, true, 'undefined active is NOT treated as inactive');

  const inactive = decideSession({ status: 'found', partner: { active: false } });
  assert.equal(inactive.keepSession, false);
  assert.equal(inactive.reason, 'revoked');
});

test('local cache hit short-circuits the Firestore round-trip', async () => {
  let getDocCalls = 0;
  const firestore = {
    getDoc: async () => { getDocCalls++; return { exists: () => false }; },
    getDocs: async () => ({ forEach: () => {} })
  };
  const localPartners = [{ id: 'fiat', name: 'Fiat', accessCode: 'FIAT2026', active: true }];
  const result = await findPartnerByInput('Fiat', { firestore, localPartners });
  assert.equal(result.status, 'found');
  assert.equal(getDocCalls, 0, 'no Firestore call needed when cache holds the partner');
});

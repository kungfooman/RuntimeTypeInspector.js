import {applyWorkerCommand} from './applyWorkerCommand.js';
/**
 * Builds fresh checking side state per test: the command mutates in
 * place, so shared fixtures would leak arms and options across tests.
 * @returns {object} Fresh breakpoints plus options.
 */
function freshDeps() {
  return {
    breakpoints: new Set(),
    options: {
      enabled: true,
      strictNullChecks: true,
      checkInfinity: true,
      windowedChecks: false,
      mapCheckWindowCap: 8,
      mapCheckWindowMinTotalMs: 0,
      checkStats: true,
    },
  };
}
function testEnableDisable() {
  // The panel enable toggle flips the checking side wholesale.
  const deps = freshDeps();
  const enabled = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'enable',
    },
  }, deps);
  const disabled = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'disable',
    },
  }, deps);
  return enabled === true && disabled === true && deps.options.enabled === false;
}
function testBreakpoints() {
  // Arms land in the checking side set the checker looks up; deletes drop.
  const deps = freshDeps();
  const added = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'addBreakpoint',
      key: 'L1-a',
    },
  }, deps);
  const has = deps.breakpoints.has('L1-a');
  const deleted = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'deleteBreakpoint',
      key: 'L1-a',
    },
  }, deps);
  return added === true && has === true && deleted === true && deps.breakpoints.has('L1-a') === false;
}
function testOptionValues() {
  // Fail closed: only real values flip, garbage reads as off or is refused.
  // Removed actions stay removed: the retired exactObjects toggle applies nothing.
  const deps = freshDeps();
  const strict = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'strictNullChecks',
      value: 'nope',
    },
  }, deps);
  const stats = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'checkStats',
      value: undefined,
    },
  }, deps);
  const unknown = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'exactObjects',
      value: true,
    },
  }, deps);
  return (
    strict === true &&
    deps.options.strictNullChecks === true &&
    stats === true &&
    deps.options.checkStats === true &&
    unknown === false
  );
}
function testWindowCapsGuarded() {
  // A floored positive cap applies; zero or garbage leaves the live value.
  const deps = freshDeps();
  const applied = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'mapCheckWindowCap',
      value: 64.9,
    },
  }, deps);
  const rejected = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'mapCheckWindowCap',
      value: 0,
    },
  }, deps);
  const budget = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'mapCheckWindowMinTotalMs',
      value: 100,
    },
  }, deps);
  const budgetRejected = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'mapCheckWindowMinTotalMs',
      value: -1,
    },
  }, deps);
  return (
    applied === true &&
    deps.options.mapCheckWindowCap === 64 &&
    rejected === false &&
    budget === true &&
    deps.options.mapCheckWindowMinTotalMs === 100 &&
    budgetRejected === false
  );
}
function testUnknownIgnored() {
  // Unknown actions stay untouched, so the caller can warn once instead
  // of throwing mid dispatch and taking down the whole bus.
  const deps = freshDeps();
  const out = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'worker',
      action: 'bogus',
    },
  }, deps);
  const uiMail = applyWorkerCommand({
    data: {
      type: 'rti',
      destination: 'ui',
      action: 'enable',
    },
  }, deps);
  return out === false && uiMail === false && deps.options.enabled === true;
}
function testWorkerErrorWarns() {
  // A worker bound addError means misrouted mail: diagnosis, not a silent
  // swallow, so the sender gets told the tracker lives panel side only.
  const deps = freshDeps();
  const orig = console.warn;
  const calls = [];
  console.warn = (...args) => {
    calls.push(args);
  };
  try {
    const out = applyWorkerCommand({
      data: {
        type: 'rti',
        destination: 'worker',
        action: 'addError',
      },
    }, deps);
    return out === true && calls.length === 1;
  } finally {
    console.warn = orig;
  }
}
export const tests = [
  testEnableDisable,
  testBreakpoints,
  testOptionValues,
  testWindowCapsGuarded,
  testUnknownIgnored,
  testWorkerErrorWarns,
];

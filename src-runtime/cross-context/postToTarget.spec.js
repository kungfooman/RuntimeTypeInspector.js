import {postToTarget} from './postToTarget.js';
function testPostsToBus() {
  // The happy path posts through: one call, same object.
  let got;
  const target = {
    postMessage(message) {
      got = message;
    },
  };
  const message = {
    type: 'rti',
  };
  postToTarget(target, message);
  return got === message;
}
function testNullTargetIsSilent() {
  // A missing bus (bare Node, wiped globals) never throws.
  postToTarget(null, {
    type: 'rti',
  });
  postToTarget(undefined, {
    type: 'rti',
  });
  return true;
}
function testBusWithoutPostSwallowed() {
  // A target without a post function (typo, half built stub) is skipped.
  postToTarget({}, {
    type: 'rti',
  });
  postToTarget({
    postMessage: 'nope',
  }, {
    type: 'rti',
  });
  return true;
}
function testThrowingBusSwallowed() {
  // A bus that throws mid post (closed worker, torn down iframe) must not
  // break the check that reported: the error is lost, the run continues.
  const target = {
    postMessage() {
      throw new Error('closed');
    },
  };
  postToTarget(target, {
    type: 'rti',
  });
  return true;
}
function testExtraArgsPassThrough() {
  // Worker style multi argument posts ride along untouched: the choke
  // point stamps and targets, never reshapes the call.
  const got = [];
  const target = {
    postMessage(...args) {
      got.push(...args);
    },
  };
  const message = {
    type: 'rti',
  };
  postToTarget(target, message, 'transfer');
  return (
    got.length === 2 &&
    got[0] === message &&
    got[1] === 'transfer'
  );
}
export const tests = [
  testPostsToBus,
  testNullTargetIsSilent,
  testBusWithoutPostSwallowed,
  testThrowingBusSwallowed,
  testExtraArgsPassThrough,
];

import StatefulPromise from './stateful-promise';

export default function promiser(state) {
  if (state && typeof state !== 'object') {
    throw new Error('The state you provide to a stateful promise must be an object of some kind.');
  }
  return new StatefulPromise(state || {});
};

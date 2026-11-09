import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source = await readFile(new URL('../../src/components/sandbox/environment.ts', import.meta.url), 'utf8');
const {code} = await transform(source, {loader:'ts', format:'esm'});
const {createEnvironment, advanceEnvironment, applyRetention, setExecuting, finishPreparation, recycleAt, runtime} = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
test('idle sleeps at 60 seconds, then recycles after 10 minutes', () => {
  const env = createEnvironment(0);
  assert.equal(advanceEnvironment(env,59999).status,'running');
  const asleep = advanceEnvironment(env,60000);
  assert.equal(asleep.status,'sleeping'); assert.equal(recycleAt(asleep),660000);
  assert.equal(advanceEnvironment(asleep,659999).status,'sleeping');
  assert.equal(advanceEnvironment(asleep,660000).status,'recycled');
});
test('background/throttled tick catches up to the original deadline', () => {
  const env = advanceEnvironment(createEnvironment(0),7200000);
  assert.equal(env.status,'recycled'); assert.equal(env.endedAt,660000);
});
test('active work never sleeps and runtime excludes idle/sleep', () => {
  const env = createEnvironment(0,true);
  assert.equal(advanceEnvironment(env,7200000).status,'running');
  const idle = setExecuting(env,false,300000);
  assert.equal(runtime(idle,600000),300000);
  assert.equal(advanceEnvironment(idle,359999).status,'running');
  assert.equal(advanceEnvironment(idle,360000).status,'sleeping');
});
test('permanent retention still sleeps and never automatically recycles', () => {
  const env = advanceEnvironment({...createEnvironment(0),retention:null},86400000);
  assert.equal(env.status,'sleeping'); assert.equal(recycleAt(env),null);
});
test('changing policy is relative to sleep start, not selection time', () => {
  const asleep = advanceEnvironment(createEnvironment(0),240000);
  assert.equal(recycleAt({...asleep,retention:20}) - 240000,17*60000);
  assert.equal(recycleAt({...asleep,retention:60}),3660000);
});
test('shorter elapsed retention recycles when explicitly applied', () => {
  const asleep = advanceEnvironment({...createEnvironment(0),retention:60},31*60000);
  assert.equal(asleep.status,'sleeping');
  assert.equal(advanceEnvironment({...asleep,retention:20},31*60000).status,'recycled');
});
test('wake preserves environment age and resets the next idle cycle', () => {
  const asleep = advanceEnvironment(createEnvironment(0),240000);
  const awake = finishPreparation({...asleep,status:'waking'},250000);
  assert.equal(awake.createdAt,0); assert.equal(awake.sleepAt,null);
  assert.equal(advanceEnvironment(awake,310000).sleepAt,310000);
});
test('recreation resets environment age but retains task runtime and policy', () => {
  const env = finishPreparation({...createEnvironment(0),status:'creating',runMs:30000,retention:20},1000000);
  assert.equal(env.createdAt,1000000); assert.equal(env.runMs,30000); assert.equal(env.retention,20); assert.equal(env.status,'running');
});

test('explicit shortening ends the environment now without reversing its age', () => {
  const asleep = advanceEnvironment({...createEnvironment(0),retention:60},31*60000);
  assert.equal(applyRetention(asleep,20,31*60000).endedAt,31*60000);
});

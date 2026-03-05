import { recognize, TASKS, countHits, hasMarker } from './src/bot/engine.js';

const task = TASKS.find(t => t.id === 'bags');
const text = 'вор на мотоцикле быстрый';
const result = recognize(text, task, []);

console.log('Result:', result);

for (const [id, b] of Object.entries(task.branches)) {
    const markerHits = countHits(text, b.markers);
    const actionHits = b.action_verbs ? countHits(text, b.action_verbs) : 0;
    console.log(`Branch ${id}: markerHits=${markerHits}, actionHits=${actionHits}`);
    if (markerHits > 0) {
        b.markers.forEach(m => {
            if (hasMarker(text, m)) console.log(`  Marker match: ${m}`);
        });
    }
    if (actionHits > 0) {
        b.action_verbs.forEach(v => {
            if (hasMarker(text, v)) console.log(`  Action match: ${v}`);
        });
    }
}

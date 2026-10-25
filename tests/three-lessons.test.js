import {test} from 'node:test';import assert from 'node:assert/strict';
import {initialState} from '../src/logic.js';import {levels,journeyLevel,canEnterLevel,objective,reconcileExhibits} from '../src/journey.js';import {earnedGuardianStamps,isGuardian} from '../src/guardian.js';import {defaults} from '../src/data/content.js';
import {roadPages,readRoadPage,hasReadRoadIntro} from '../src/road-reading.js';
test('exactly three lessons award three stamps and legend ends without any exhibit',()=>{
 const s=initialState();assert.equal(levels.length,3);assert.equal(canEnterLevel(s,4),false);assert.equal(isGuardian(s),false);s.journey.schoolReady=true;assert.deepEqual(earnedGuardianStamps(s).map(x=>x.id),['school']);s.completed=['path','trash'];s.guardian.legendQuizPassed=true;assert.equal(journeyLevel(s),4);assert.equal(isGuardian(s),true);assert.equal(earnedGuardianStamps(s).length,3);assert.equal(objective(s,defaults,null),null);
 s.journey.exhibitIds=['legacy'];reconcileExhibits(s,[]);assert.equal(isGuardian(s),true);assert.equal(journeyLevel(s),4);
});
test('road lesson requires school and sequential acknowledgements; partial progress restores without unlocking',()=>{
 const s=initialState();assert.equal(readRoadPage(s,roadPages[0].id),false);s.journey.schoolReady=true;assert.equal(readRoadPage(s,roadPages[2].id),false);assert.equal(readRoadPage(s,roadPages[0].id),true);assert.equal(readRoadPage(s,roadPages[0].id),true);assert.equal(hasReadRoadIntro(s),false);
 const restored=JSON.parse(JSON.stringify(s));assert.equal(readRoadPage(restored,roadPages[2].id),false);assert.equal(readRoadPage(restored,roadPages[1].id),true);assert.equal(hasReadRoadIntro(restored),false);assert.equal(readRoadPage(restored,roadPages[2].id),true);assert.equal(hasReadRoadIntro(restored),true);assert.equal(restored.journey.roadReading.length,3);assert.equal(readRoadPage(restored,'made-up'),false);
});

test('library offers five readable optional topics without falsely claiming official review',async()=>{
 const {libraryBooks,libraryReviewNotes}=await import('../src/data/library-books.js');assert.equal(libraryBooks.length,5);assert.equal(new Set(libraryBooks.map(b=>b.id)).size,5);assert.equal(new Set(libraryBooks.map(b=>b.scene)).size,5);
 for(const b of libraryBooks){assert.equal(b.checkedAt,null);assert.equal(b.reviewStatus,'수업용 제공 자료');assert.ok(b.pages.length>=3);assert.ok(b.pages.every(p=>p.title&&p.text&&p.situation));assert.ok(b.references.every(r=>new URL(r.url).protocol==='https:'))}
 assert.ok(libraryReviewNotes.some(n=>n.includes('백낙신')));assert.equal(libraryBooks.flatMap(b=>b.pages).some(p=>p.text.includes('강주룡')),false);
});

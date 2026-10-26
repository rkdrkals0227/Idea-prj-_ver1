import{test}from'node:test';import assert from'node:assert/strict';import{MapView,normaliseMapZoom,mapPoint}from'../src/map-view.js';import{freshRun}from'../src/play-session.js';
test('zoom keeps the chosen point fixed and clamps zoom and panning to the map',()=>{
 const v=new MapView();v.setZoom(2,{x:300,y:200});assert.equal(v.zoom,2);assert.equal(v.panX,110);assert.equal(v.panY,75);v.panBy(9999,-9999);assert.equal(v.panX,410);assert.equal(v.panY,-275);v.setZoom(99);assert.equal(v.zoom,3);v.setZoom(1);assert.equal(v.panX,0);assert.equal(v.panY,0);v.setZoom(NaN);assert.equal(v.zoom,1);
});
test('centering stays bounded and reset shows the whole map again',()=>{
 const v=new MapView(3);v.centreOn(mapPoint({x:0,z:0}));assert.equal(v.panX,0);assert.equal(v.panY,0);v.centreOn(mapPoint({x:-33,z:-28}));assert.equal(v.panX,820);assert.equal(v.panY,550);v.reset();assert.deepEqual([v.zoom,v.panX,v.panY],[1,0,0]);
});
test('personal map zoom survives fresh games and invalid stored values use the default',()=>{
 assert.equal(freshRun({settings:{mapZoom:2.25}}).settings.mapZoom,2.25);for(const bad of [undefined,null,'x',Infinity,99,.2])assert.equal(normaliseMapZoom(bad),1);assert.deepEqual(mapPoint({x:0,z:0}),{x:410,y:275});
});

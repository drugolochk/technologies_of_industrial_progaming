import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApp as createNine} from '../../practice-09/src/app.js';
import {createApp as createTen} from '../../practice-10/src/app.js';
import {createApiClient} from '../src/api-client.js';
import {createTaskApi} from '../src/task-api.js';

async function withApi(create,run){
 const server=create().listen(0,'127.0.0.1');
 await new Promise(r=>server.once('listening',r));
 const baseUrl=`http://127.0.0.1:${server.address().port}/api`;
 const api=createTaskApi(createApiClient({baseUrl}));
 try{await run(api,baseUrl);}finally{await new Promise((r,j)=>server.close(e=>e?j(e):r()));}
}
test('ПР8 + ПР9: загрузка массива задач вместе с категориями',()=>withApi(createNine,async api=>{
 const s=await api.loadInitialData({categoryId:2});
 assert.deepEqual(s.tasks.map(t=>t.id),[4,16,22,25,28,34]);
 assert.equal(s.categories.length,3);assert.equal(s.meta.total,6);
}));
test('ПР8 + ПР9: completed=true передаётся на сервер',()=>withApi(createNine,async api=>{
 const s=await api.getTasks({completed:true});
 assert.deepEqual(s.tasks.map(t=>t.id),[1,10,16,25,31]);assert.equal(s.meta.total,5);
}));
test('ПР8 + ПР9: создание и последующее чтение',()=>withApi(createNine,async api=>{
 const t=await api.createTask({title:'  Новая задача  ',priority:'high',categoryId:2});
 assert.equal(t.id,35);assert.equal(t.title,'Новая задача');
 assert.equal((await api.getTaskById(t.id)).title,t.title);
 assert.equal((await api.getTasks()).meta.total,13);
}));
test('ПР8 + ПР9: невалидный POST не изменяет хранилище',()=>withApi(createNine,async(api,url)=>{
 const r=await fetch(`${url}/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:' ',priority:'high',categoryId:2})});
 assert.equal(r.status,400);assert.ok((await r.json()).error.details.title);
 assert.equal((await api.getTasks()).meta.total,12);
}));
test('ПР9 сохраняет границу этапа: PATCH и DELETE относятся к ПР10',()=>withApi(createNine,async api=>{
 await assert.rejects(api.setTaskCompleted(4,true),e=>e.status===405);
 await assert.rejects(api.deleteTask(4),e=>e.status===405);
}));
test('ПР8 + ПР10: исходный контракт data/meta сохранён',()=>withApi(createTen,async api=>{
 const s=await api.getTasks({categoryId:2,completed:true});
 assert.deepEqual(s.tasks.map(t=>t.id),[16,25]);assert.equal(s.meta.total,2);
 assert.equal(s.meta.filters.categoryId,2);assert.equal(s.meta.filters.completed,true);
}));
test('ПР8 + ПР10: полный цикл CRUD',()=>withApi(createTen,async api=>{
 const t=await api.createTask({title:'Интеграция',priority:'medium',categoryId:2});
 const patched=await api.setTaskCompleted(t.id,true);assert.equal(patched.completed,true);
 assert.ok((await api.getTasks({completed:true})).tasks.some(x=>x.id===t.id));
 await api.deleteTask(t.id);assert.equal((await api.getTasks()).meta.total,12);
}));
const valid={id:1,title:'Тест',priority:'high',categoryId:1,completed:false};
test('Массив не обходит проверку полей задачи',async()=>{
 const api=createTaskApi({requestJson:async()=>[{...valid,title:''}]});
 await assert.rejects(api.getTasks(),e=>e.kind==='invalid-response');
});
test('Массив не обходит проверку уникальности id',async()=>{
 const api=createTaskApi({requestJson:async()=>[valid,{...valid}]});
 await assert.rejects(api.getTasks(),e=>e.kind==='invalid-response');
});
test('Проверка meta.total для старого контракта остаётся строгой',async()=>{
 const api=createTaskApi({requestJson:async()=>({data:[valid],meta:{total:2}})});
 await assert.rejects(api.getTasks(),e=>e.kind==='invalid-response');
});

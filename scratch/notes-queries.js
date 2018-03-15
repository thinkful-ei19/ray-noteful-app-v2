'use strict';

const knex = require('../knex');

knex.select(1).then(res => console.log(res));


// knex
//   .from('notes')
//   .select('id', 'title', 'content')
//   .where('title', 'like', '%cats%')
//   .then(result => console.log(result));


// knex 
//   .from('notes')
//   .select()
//   .where('id', '1001')
//   .then(result => console.log(result));


// knex
//   .from('notes')
//   .update({title: 'Updated Title', content: 'Updated Content'})
//   .where('id', '1010')
//   .then(result => console.log(result));


// knex('notes')
//   .insert({title: 'New Title', content: 'New Content'})
//   .returning(['id', 'title', 'content'])
//   .then(result => console.log(result));


// knex('notes')
//   .select('id', 'title', 'content')
//   .where('id', '1002')
//   .del()
//   .then(result => console.log(result));




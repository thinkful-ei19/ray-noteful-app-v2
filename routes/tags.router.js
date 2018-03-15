'use strict';


const express = require('express');
const knex = require('../knex');

const router = express.Router();

//GET all tags
router.get('/tags', (req, res, next) => {
  knex.select('id', 'name')
    .from('tags')
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
});


//GET single tag
router.get('/tags/:id', (req, res, next) => {
  const tagId = req.params.id;
  knex.first('id', 'name')
    .from('tags')
    .where('id', tagId)
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});


//PUT/update a single tag
router.put('/tags/:id', (req, res, next) => {
  const tagId = req.params.id;
  //Never trust users - validate input
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if(field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  //Never trust users = validate input
  if(!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex('tags')
    .update({
      name: updateObj.name    
    })
    .where('id', tagId)
    .returning(['id', 'name'])
    .then(results => {
      if(results) {
        res.json(results);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});




//POST/create item
router.post('/tags', (req, res, next) => {
  const {name} = req.body;

  //Never trust users. Validate input
  if(!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  const newItem = {name};

  knex
    .insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then(([results]) => {
      //Uses Array index solution to get first item in results array
      if(results) {
        res.location(`http://${req.headers.host}/${results.id}`).status(201).json(results);
      }
    //   const result = results[0];
    //   res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});


//DELETE single tag
router.delete('/tags/:id', (req, res, next) => {
  const id = req.params.id;
  knex('tags')
    .select('id', 'name')
    .where('id', id)
    .del()
    .then(count => {
      if(count) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

module.exports = router;

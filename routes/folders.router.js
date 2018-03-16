'use strict';


const express = require('express');
const knex = require('../knex');

const router = express.Router();

// GET all folders
router.get('/folders', (req, res, next) => {
    knex.select('id', 'name')
      .from('folders')
      .then(results => {
        res.json(results);
      })
      .catch(err => next(err));
  });


//GET single folder
router.get('/folders/:id', (req, res, next) => {
    const folderId = req.params.id;
    knex.first('id', 'name')
        .from('folders')
        .where('id', folderId)
        .then(result => {
            if(result) {
              res.json(result);
            } else {
                next();
            }
        })
        .catch(err => next(err));
});


// PUT/UPDATE a single item
router.put('/folders/:id', (req, res, next) => {
  const folderId = req.params.id;
  //Never trust users - validate input
  const updateObj = {};
  const updateableFields = ['name'];

  updateableFields.forEach(field => {
    if(field in req.body) {
      updateObj[field] = req.body[field];
    }
  });

  //Never trust users = validate input
  if (!updateObj.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex('folders')
    .update({
        name: updateObj.name
    })
    .where('id', folderId)
    .returning(['id', 'name'])
    .then(item => {
      if(item) {
        res.json(item);
      } else {
          next();
      }
    })
    .catch(err => next(err));
});


// POST/create item
router.post('/folders', (req, res, next) => {
  const {name} = req.body;
  
  const newFolder = {name};
  //Never trust users. Validate input
  if(!newFolder.name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }
  knex
    .insert(newFolder)
    .into('folders')
    .returning(['name'])
    .then(item => {
      if(item) {
        res.location(`http://${req.headers.host}/folders/${item.id}`).status(201).json(item);
      }
    })
    .catch(err => next(err));
});


//DELETE single item
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;

  knex('folders')
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

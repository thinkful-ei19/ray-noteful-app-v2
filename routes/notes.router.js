'use strict';

const express = require('express');
const knex = require('../knex');
//Import hydration module
const hydrateNotes = require('../utils/hydrateNotes');

// Create an router instance (aka "mini-app")
const router = express.Router();

// TEMP: Simple In-Memory Database
/* 
const data = require('../db/notes');
const simDB = require('../db/simDB');
const notes = simDB.initialize(data);
*/

// Get All (and search by query)
/* ========== GET/READ ALL NOTES ========== */
router.get('/notes', (req, res, next) => {
  const {searchTerm, folderId, tagId} = req.query;
  
  knex.select('notes.id', 'title', 'content',
    'folders.id as folderId', 'folders.name as folderName',
    'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    
    .modify(function (queryBuilder) {
      // console.log(queryBuilder);
      
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .modify(function (queryBuilder) {
      if(tagId) {
        queryBuilder.where('tag_id', tagId);
      }
    })
    .orderBy('notes.id')
    .then(result => {
      if(result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== GET/READ SINGLE NOTES ========== */
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex.select('notes.id', 'title', 'content',
    'folders.id as folderId', 'folders.name as folderName',
    'tags.id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
    .modify(function(queryBuilder) {
      queryBuilder.where('notes.id', noteId);
    })
    .then(result => {
      if(result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;
  const {title, content, folderId, tags} = req.body;
  /***** Never trust users - validate input *****/

  if (!req.body.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: folderId
  };

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .then(() => {
      return knex.del()
        .from('notes_tags')
        .where('note_id', noteId);
    })
    .then(() => {
      const tagsInsert = tags.map(tid => ({ note_id: noteId, tag_id: tid }));
      return knex.insert(tagsInsert)
        .into('notes_tags');
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folderId', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result);
        res.json(hydrated[0]);
      } else {
        next();
      }
    })
    .catch(next);
});

/* ========== POST/CREATE ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id, tags = [] } = req.body; // Add `folder_id`
  console.log('-------', req.body);
  if(!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  
  const newItem = {
    title: title,
    content: content,
    folder_id: folder_id  // Add `folder_id`
  };

  let noteId;
  // Insert new note into notes table
  knex.insert(newItem).into('notes').returning('id')
    .then(([id]) => {
      // Insert related tags into notes_tags table
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      // Select the new note and leftJoin on folders and tags
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        // Hydrate the results
        const hydrated = hydrateNotes(result)[0];
        // Respond with a location header, a 201 status and a note object
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .select('id', 'title', 'content')
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
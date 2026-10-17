import test from 'node:test'
import assert from 'node:assert/strict'
import {summarizeConceptEvidence} from '../services/learning.js'

test('concept evidence aggregates responses across attempts without crossing concepts',()=>{
  const evidence=summarizeConceptEvidence([
    {responses:[{conceptId:'concept-a',isCorrect:true},{conceptId:'concept-a',isCorrect:false}]},
    {responses:[{conceptId:'concept-a',isCorrect:true},{conceptId:'concept-b',isCorrect:false}]},
  ])
  assert.deepEqual(evidence.get('concept-a'),{evidenceCount:3,correctCount:2})
  assert.deepEqual(evidence.get('concept-b'),{evidenceCount:1,correctCount:0})
})

test('no evidence produces no concept recommendation',()=>{
  assert.equal(summarizeConceptEvidence([]).size,0)
})

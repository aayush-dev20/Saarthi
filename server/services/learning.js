import {AssessmentAttempt,Concept,LearningPlan,Question} from '../models/Learning.js'

export function summarizeConceptEvidence(attempts){
  const counts=new Map()
  for(const attempt of attempts)for(const response of attempt.responses){
    const key=String(response.conceptId)
    const current=counts.get(key)||{evidenceCount:0,correctCount:0}
    current.evidenceCount++
    if(response.isCorrect)current.correctCount++
    counts.set(key,current)
  }
  return counts
}

export async function refreshLearningPlans(studentId,subjectId){
  const attempts=await AssessmentAttempt.find({studentId,subjectId}).lean()
  const evidence=summarizeConceptEvidence(attempts)
  const concepts=await Concept.find({subjectId,isActive:true}).lean()
  const activeIds=new Set(concepts.map(c=>String(c._id)))
  for(const concept of concepts){
    const score=evidence.get(String(concept._id))
    if(!score||score.evidenceCount<3)continue
    const accuracy=Math.round(score.correctCount/score.evidenceCount*100)
    const status=accuracy<60?'open':accuracy<80?'improving':'resolved'
    const questionIds=await Question.find({conceptId:concept._id,isActive:true}).select('_id').limit(5).lean()
    await LearningPlan.findOneAndUpdate({studentId,conceptId:concept._id},{$set:{evidenceCount:score.evidenceCount,correctCount:score.correctCount,accuracy,reason:`${score.correctCount} correct of ${score.evidenceCount} recorded responses across completed assessments.`,recommendedQuestionIds:questionIds.map(q=>q._id),status}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true})
  }
  await LearningPlan.deleteMany({studentId,conceptId:{$nin:[...activeIds]}})
}

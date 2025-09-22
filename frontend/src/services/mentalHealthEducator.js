/**
 * Mental Health Education Engine
 * Provides educational content and explanations for students
 */

export class MentalHealthEducator {
  constructor() {
    this.educationalContent = {
      depression: {
        title: "Understanding Depression",
        summary: "Depression is a mood disorder that causes persistent feelings of sadness and loss of interest.",
        symptoms: [
          "Persistent sad or empty mood",
          "Loss of interest in activities",
          "Fatigue or decreased energy",
          "Difficulty concentrating",
          "Changes in appetite or sleep",
          "Feelings of worthlessness or guilt"
        ],
        causes: [
          "Brain chemistry imbalances",
          "Genetics and family history",
          "Life events and trauma",
          "Medical conditions",
          "Certain medications",
          "Substance abuse"
        ],
        coping: [
          "Regular exercise and physical activity",
          "Maintain social connections",
          "Practice mindfulness and meditation",
          "Keep a regular sleep schedule",
          "Eat a balanced diet",
          "Seek professional help when needed"
        ],
        myths: [
          {
            myth: "Depression is just sadness",
            fact: "Depression is a serious medical condition that affects brain chemistry, not just temporary sadness"
          },
          {
            myth: "You can just 'snap out of it'",
            fact: "Depression requires proper treatment and support, just like any other medical condition"
          },
          {
            myth: "Medication is the only solution",
            fact: "Treatment can include therapy, lifestyle changes, support groups, and sometimes medication"
          }
        ]
      },

      anxiety: {
        title: "Understanding Anxiety",
        summary: "Anxiety disorders involve excessive worry or fear that interferes with daily activities.",
        symptoms: [
          "Excessive worry or fear",
          "Restlessness or feeling on edge",
          "Difficulty concentrating",
          "Muscle tension",
          "Sleep disturbances",
          "Panic attacks"
        ],
        causes: [
          "Brain chemistry and genetics",
          "Environmental stressors",
          "Traumatic experiences",
          "Medical conditions",
          "Caffeine and stimulants",
          "Personality factors"
        ],
        coping: [
          "Deep breathing exercises",
          "Progressive muscle relaxation",
          "Limit caffeine intake",
          "Regular exercise",
          "Challenge negative thoughts",
          "Practice grounding techniques"
        ],
        myths: [
          {
            myth: "Anxiety is not a real illness",
            fact: "Anxiety disorders are legitimate medical conditions that affect millions of people"
          },
          {
            myth: "Avoiding triggers will cure anxiety",
            fact: "Avoidance often makes anxiety worse; gradual exposure with support is more effective"
          },
          {
            myth: "Anxiety medication is addictive",
            fact: "Most anxiety medications, when used properly under medical supervision, are not addictive"
          }
        ]
      },

      stress: {
        title: "Understanding Stress",
        summary: "Stress is the body's response to challenges or demands, which can be positive or negative.",
        symptoms: [
          "Physical tension or headaches",
          "Feeling overwhelmed",
          "Mood swings or irritability",
          "Difficulty sleeping",
          "Changes in appetite",
          "Difficulty concentrating"
        ],
        causes: [
          "Academic pressures",
          "Financial concerns",
          "Relationship issues",
          "Work demands",
          "Major life changes",
          "Health problems"
        ],
        coping: [
          "Time management and organization",
          "Regular exercise",
          "Relaxation techniques",
          "Social support",
          "Healthy boundaries",
          "Professional help when needed"
        ],
        myths: [
          {
            myth: "All stress is bad",
            fact: "Some stress can be motivating and helpful; it's chronic stress that causes problems"
          },
          {
            myth: "Stress only affects mental health",
            fact: "Chronic stress can impact physical health, immune system, and overall wellbeing"
          },
          {
            myth: "Successful people don't get stressed",
            fact: "Everyone experiences stress; successful people often have better coping strategies"
          }
        ]
      },

      assessments: {
        title: "Understanding Mental Health Assessments",
        summary: "Assessments help identify symptoms and guide appropriate treatment and support.",
        phq9: {
          name: "PHQ-9 (Depression Screening)",
          purpose: "Measures severity of depression symptoms over the past 2 weeks",
          scoring: {
            "0-4": { level: "Minimal", description: "Little to no depression symptoms" },
            "5-9": { level: "Mild", description: "Some symptoms that may benefit from attention" },
            "10-14": { level: "Moderate", description: "Symptoms that likely impact daily life" },
            "15-19": { level: "Moderately Severe", description: "Significant symptoms requiring professional help" },
            "20-27": { level: "Severe", description: "Symptoms requiring immediate professional attention" }
          }
        },
        gad7: {
          name: "GAD-7 (Anxiety Screening)",
          purpose: "Measures severity of anxiety symptoms over the past 2 weeks",
          scoring: {
            "0-4": { level: "Minimal", description: "Little to no anxiety symptoms" },
            "5-9": { level: "Mild", description: "Some anxiety that may be manageable" },
            "10-14": { level: "Moderate", description: "Anxiety that likely impacts daily functioning" },
            "15-21": { level: "Severe", description: "Significant anxiety requiring professional help" }
          }
        },
        importance: [
          "Provides objective measurement of symptoms",
          "Helps track progress over time",
          "Guides treatment recommendations",
          "Helps communicate with healthcare providers",
          "Reduces stigma through scientific approach"
        ]
      },

      wellness: {
        title: "Understanding Wellness Scores",
        summary: "Wellness scores provide a snapshot of your current mental health status.",
        interpretation: {
          "80-100": {
            level: "Excellent Wellness",
            description: "You're doing great! Keep up your current self-care practices.",
            recommendations: ["Maintain current routines", "Share strategies that work", "Support others"]
          },
          "60-79": {
            level: "Good Wellness", 
            description: "You're managing well with some areas to focus on.",
            recommendations: ["Identify stress triggers", "Enhance coping strategies", "Consider preventive care"]
          },
          "40-59": {
            level: "Moderate Concerns",
            description: "Some symptoms that may benefit from additional support.",
            recommendations: ["Seek counseling support", "Implement stress management", "Monitor symptoms closely"]
          },
          "20-39": {
            level: "Significant Concerns",
            description: "Symptoms are likely impacting your daily life significantly.",
            recommendations: ["Professional help strongly recommended", "Develop safety plan", "Increase support system"]
          },
          "0-19": {
            level: "Serious Concerns",
            description: "Immediate professional support is recommended.",
            recommendations: ["Seek immediate professional help", "Emergency resources if needed", "Crisis support available"]
          }
        }
      },

      crisisResources: {
        title: "Crisis Support & Emergency Resources",
        immediate: [
          {
            name: "National Suicide Prevention Lifeline",
            number: "988",
            description: "24/7 crisis support and suicide prevention"
          },
          {
            name: "Crisis Text Line",
            number: "Text HOME to 741741",
            description: "24/7 text-based crisis support"
          },
          {
            name: "Emergency Services",
            number: "911",
            description: "For immediate life-threatening emergencies"
          }
        ],
        signs: [
          "Thoughts of death or suicide",
          "Feeling hopeless or trapped",
          "Extreme mood swings",
          "Substance abuse escalation",
          "Withdrawal from friends and activities",
          "Giving away possessions"
        ],
        helpFriend: [
          "Take threats seriously",
          "Listen without judgment",
          "Ask directly about suicide",
          "Help them get professional help",
          "Stay with them or ensure safety",
          "Follow up regularly"
        ]
      }
    }
  }

  getEducationalContent(topic, subtopic = null) {
    if (subtopic) {
      return this.educationalContent[topic]?.[subtopic] || null
    }
    return this.educationalContent[topic] || null
  }

  explainAssessmentResult(type, score) {
    if (type === 'PHQ-9') {
      const assessment = this.educationalContent.assessments.phq9
      let scoreRange = '0-4'
      
      if (score >= 5 && score <= 9) scoreRange = '5-9'
      else if (score >= 10 && score <= 14) scoreRange = '10-14'
      else if (score >= 15 && score <= 19) scoreRange = '15-19'
      else if (score >= 20) scoreRange = '20-27'

      const result = assessment.scoring[scoreRange]
      return {
        assessment: assessment.name,
        purpose: assessment.purpose,
        score,
        level: result.level,
        description: result.description,
        explanation: this.getDetailedExplanation('depression', result.level)
      }
    }

    if (type === 'GAD-7') {
      const assessment = this.educationalContent.assessments.gad7
      let scoreRange = '0-4'
      
      if (score >= 5 && score <= 9) scoreRange = '5-9'
      else if (score >= 10 && score <= 14) scoreRange = '10-14'
      else if (score >= 15) scoreRange = '15-21'

      const result = assessment.scoring[scoreRange]
      return {
        assessment: assessment.name,
        purpose: assessment.purpose,
        score,
        level: result.level,
        description: result.description,
        explanation: this.getDetailedExplanation('anxiety', result.level)
      }
    }

    return null
  }

  explainWellnessScore(percentage) {
    const wellness = this.educationalContent.wellness
    let range = '0-19'
    
    if (percentage >= 20 && percentage <= 39) range = '20-39'
    else if (percentage >= 40 && percentage <= 59) range = '40-59'
    else if (percentage >= 60 && percentage <= 79) range = '60-79'
    else if (percentage >= 80) range = '80-100'

    const result = wellness.interpretation[range]
    return {
      percentage,
      level: result.level,
      description: result.description,
      recommendations: result.recommendations,
      explanation: `Your wellness score of ${percentage}% indicates ${result.level.toLowerCase()}. ${result.description}`
    }
  }

  getDetailedExplanation(condition, severity) {
    const content = this.educationalContent[condition]
    if (!content) return "No detailed explanation available."

    const severityLevel = severity.toLowerCase()
    
    if (severityLevel.includes('minimal')) {
      return `You're experiencing very few symptoms of ${condition}. This is a positive indicator of your mental health. Continue with your current self-care practices and maintain healthy habits.`
    } else if (severityLevel.includes('mild')) {
      return `You're experiencing some symptoms of ${condition} that may benefit from attention. This is common and manageable with proper support and coping strategies.`
    } else if (severityLevel.includes('moderate')) {
      return `You're experiencing moderate symptoms of ${condition} that are likely impacting your daily life. Professional support and evidence-based treatments can be very helpful.`
    } else if (severityLevel.includes('severe')) {
      return `You're experiencing significant symptoms of ${condition} that require professional attention. This is a serious condition, but effective treatments are available.`
    }

    return `Understanding ${condition} is important for your mental health journey. Professional guidance can help you develop effective coping strategies.`
  }

  getCopingStrategies(condition, severity = 'general') {
    const content = this.educationalContent[condition]
    if (!content) return []

    let strategies = [...content.coping]

    // Add severity-specific strategies
    if (severity.toLowerCase().includes('severe')) {
      strategies.unshift(
        "Seek immediate professional help",
        "Develop a safety plan",
        "Increase support system"
      )
    } else if (severity.toLowerCase().includes('moderate')) {
      strategies.unshift(
        "Consider professional counseling",
        "Practice stress management daily"
      )
    }

    return strategies
  }

  getMyths(condition) {
    const content = this.educationalContent[condition]
    return content?.myths || []
  }

  getCrisisInformation() {
    return this.educationalContent.crisisResources
  }

  generateEducationalResponse(topic, userAssessment = null) {
    const content = this.getEducationalContent(topic)
    if (!content) return "I don't have information about that topic right now."

    let response = `## ${content.title}\n\n${content.summary}\n\n`

    if (content.symptoms) {
      response += `**Common Symptoms:**\n`
      content.symptoms.forEach(symptom => {
        response += `• ${symptom}\n`
      })
      response += '\n'
    }

    if (content.coping) {
      response += `**Coping Strategies:**\n`
      content.coping.forEach(strategy => {
        response += `• ${strategy}\n`
      })
      response += '\n'
    }

    if (userAssessment && userAssessment.severity) {
      const strategies = this.getCopingStrategies(topic, userAssessment.severity)
      response += `**Personalized Recommendations for ${userAssessment.severity} Level:**\n`
      strategies.slice(0, 3).forEach(strategy => {
        response += `• ${strategy}\n`
      })
      response += '\n'
    }

    response += `Would you like me to explain more about any specific aspect of ${topic}?`

    return response
  }
}
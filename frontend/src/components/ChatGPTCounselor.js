/**
 * ChatGPT-Powered Counselor for React/JavaScript
 * Direct integration with OpenAI API in the browser
 */

class ChatGPTCounselor {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';
        this.conversationHistory = [];
        
        // System prompt for counseling
        this.systemPrompt = `You are a compassionate, professional mental health counselor specializing in student wellbeing. Your role is to:

1. Provide empathetic, supportive responses that validate emotions
2. Offer practical coping strategies and techniques
3. Ask thoughtful follow-up questions to encourage reflection
4. Maintain professional boundaries while being warm and caring
5. Recognize when to suggest professional help for serious concerns
6. Be culturally sensitive and inclusive
7. Use person-first language and avoid diagnostic terms

Guidelines:
- Always acknowledge and validate the person's feelings
- Provide specific, actionable advice when appropriate
- Ask open-ended questions to encourage deeper reflection
- Be concise but thorough (aim for 2-4 sentences per response)
- If someone expresses suicidal thoughts or self-harm, encourage immediate professional help
- Remember this is a supportive conversation, not therapy or diagnosis

Respond in a warm, professional tone that makes the person feel heard and supported.`;

        // Risk assessment keywords
        this.highRiskKeywords = [
            'suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead',
            'self harm', 'cut myself', 'hurt myself', 'no point', 'give up completely'
        ];
        
        this.moderateRiskKeywords = [
            'hopeless', 'can\'t go on', 'overwhelming', 'desperate', 'worthless',
            'trapped', 'unbearable', 'can\'t cope', 'falling apart'
        ];
    }

    detectRiskLevel(message) {
        const messageLower = message.toLowerCase();
        
        // Check for high-risk indicators
        for (const keyword of this.highRiskKeywords) {
            if (messageLower.includes(keyword)) {
                return 'high';
            }
        }
        
        // Check for moderate risk indicators
        for (const keyword of this.moderateRiskKeywords) {
            if (messageLower.includes(keyword)) {
                return 'moderate';
            }
        }
        
        return 'low';
    }

    buildContextPrompt(message, assessmentData, riskLevel) {
        const contextParts = [];
        
        // Risk level context
        if (riskLevel === 'high') {
            contextParts.push("IMPORTANT: This person may be expressing thoughts of self-harm or suicide. Please respond with immediate concern, validation, and strong encouragement to seek professional help.");
        } else if (riskLevel === 'moderate') {
            contextParts.push("This person seems to be struggling significantly. Please provide extra support and consider suggesting professional resources.");
        }
        
        // Assessment context
        if (assessmentData) {
            const phq9Score = assessmentData.phq9_score || 0;
            const gad7Score = assessmentData.gad7_score || 0;
            
            if (phq9Score >= 15) {
                contextParts.push(`This person scored ${phq9Score} on PHQ-9, indicating severe depression symptoms.`);
            } else if (phq9Score >= 10) {
                contextParts.push(`This person scored ${phq9Score} on PHQ-9, indicating moderate depression symptoms.`);
            }
            
            if (gad7Score >= 15) {
                contextParts.push(`This person scored ${gad7Score} on GAD-7, indicating severe anxiety symptoms.`);
            } else if (gad7Score >= 10) {
                contextParts.push(`This person scored ${gad7Score} on GAD-7, indicating moderate anxiety symptoms.`);
            }
        }
        
        contextParts.push("Please provide a thoughtful, empathetic response that validates their feelings and offers helpful guidance or questions for reflection.");
        
        return contextParts.join(" ");
    }

    getContextStrategies(message, riskLevel) {
        const messageLower = message.toLowerCase();
        const strategies = [];
        
        // Anxiety-related strategies
        if (['anxious', 'worried', 'nervous', 'panic', 'stressed'].some(word => messageLower.includes(word))) {
            strategies.push(
                "Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, exhale for 8",
                "Use the 5-4-3-2-1 grounding method: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste",
                "Take a 10-minute walk while focusing on your breathing"
            );
        }
        
        // Depression-related strategies
        if (['sad', 'depressed', 'hopeless', 'empty', 'lonely'].some(word => messageLower.includes(word))) {
            strategies.push(
                "Reach out to one person you trust, even just to say hello",
                "Do one small act of self-care like making tea or taking a shower",
                "Write down three things you're grateful for, no matter how small"
            );
        }
        
        // Academic stress strategies
        if (['exam', 'study', 'grades', 'assignment', 'school', 'college'].some(word => messageLower.includes(word))) {
            strategies.push(
                "Break large tasks into smaller, manageable steps",
                "Use the Pomodoro technique: 25 minutes focused work, 5 minute break",
                "Create a realistic study schedule with built-in breaks"
            );
        }
        
        // General strategies for high risk
        if (riskLevel === 'high') {
            return [
                "Contact a crisis helpline: National Suicide Prevention Lifeline 988",
                "Reach out to a trusted friend, family member, or counselor immediately",
                "Go to your nearest emergency room if you're in immediate danger"
            ];
        }
        
        return strategies.slice(0, 4); // Limit to 4 strategies
    }

    async getCounselingResponse(message, assessmentData = null) {
        try {
            // Detect risk level
            const riskLevel = this.detectRiskLevel(message);
            
            // Build context-aware prompt
            const contextPrompt = this.buildContextPrompt(message, assessmentData, riskLevel);
            
            // Prepare messages for ChatGPT
            const messages = [
                { role: "system", content: this.systemPrompt },
                { role: "system", content: contextPrompt }
            ];
            
            // Add conversation history (last 6 messages for context)
            if (this.conversationHistory.length > 0) {
                const recentHistory = this.conversationHistory.slice(-6);
                for (const entry of recentHistory) {
                    messages.push({ role: "user", content: entry.user });
                    messages.push({ role: "assistant", content: entry.assistant });
                }
            }
            
            // Add current message
            messages.push({ role: "user", content: message });
            
            // Call ChatGPT API
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo", // or "gpt-4" for better quality
                    messages: messages,
                    max_tokens: 300,
                    temperature: 0.7,
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const chatgptResponse = data.choices[0].message.content.trim();
            
            // Store in conversation history
            this.conversationHistory.push({
                user: message,
                assistant: chatgptResponse,
                timestamp: new Date().toISOString(),
                riskLevel: riskLevel
            });
            
            // Generate coping strategies
            const copingStrategies = this.getContextStrategies(message, riskLevel);
            
            return {
                response: chatgptResponse,
                riskLevel: riskLevel,
                copingStrategies: copingStrategies,
                tokensUsed: data.usage.total_tokens,
                model: data.model,
                assessmentInformed: Boolean(assessmentData),
                timestamp: new Date().toISOString(),
                conversationLength: this.conversationHistory.length
            };
            
        } catch (error) {
            console.error('ChatGPT API error:', error);
            return this.getFallbackResponse(message, error.message);
        }
    }

    getFallbackResponse(message, error) {
        const riskLevel = this.detectRiskLevel(message);
        
        let fallbackResponse;
        if (riskLevel === 'high') {
            fallbackResponse = "I can hear that you're going through an incredibly difficult time right now. Your safety and wellbeing are the most important things. Please reach out to a crisis counselor immediately - you can call 988 for the National Suicide Prevention Lifeline. You don't have to go through this alone.";
        } else {
            fallbackResponse = "Thank you for sharing what's on your mind with me. I can see that you're dealing with some challenges right now. While I'm having some technical difficulties at the moment, I want you to know that your feelings are valid and you deserve support. Consider reaching out to a counselor or trusted friend if you'd like to talk more about what you're experiencing.";
        }
        
        return {
            response: fallbackResponse,
            riskLevel: riskLevel,
            copingStrategies: this.getContextStrategies(message, riskLevel),
            isFallback: true,
            error: error,
            timestamp: new Date().toISOString()
        };
    }

    clearConversationHistory() {
        this.conversationHistory = [];
    }

    getConversationSummary() {
        if (this.conversationHistory.length === 0) {
            return { message: 'No conversation history' };
        }
        
        const totalExchanges = this.conversationHistory.length;
        const riskLevels = this.conversationHistory.map(entry => entry.riskLevel);
        const highRiskCount = riskLevels.filter(level => level === 'high').length;
        const moderateRiskCount = riskLevels.filter(level => level === 'moderate').length;
        
        return {
            totalExchanges,
            highRiskMessages: highRiskCount,
            moderateRiskMessages: moderateRiskCount,
            conversationStarted: this.conversationHistory[0].timestamp,
            lastMessage: this.conversationHistory[this.conversationHistory.length - 1].timestamp,
            requiresFollowup: highRiskCount > 0 || moderateRiskCount > 2
        };
    }
}

export default ChatGPTCounselor;
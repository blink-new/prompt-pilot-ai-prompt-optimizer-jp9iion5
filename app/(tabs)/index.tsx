import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { Audio } from 'expo-av'
import { blink } from '@/lib/blink'

const AI_MODELS = [
  { 
    id: 'chatgpt', 
    name: 'ChatGPT', 
    icon: '🤖',
    description: 'Best for conversational AI, writing, and analysis',
    strengths: ['conversation', 'writing', 'analysis', 'general knowledge']
  },
  { 
    id: 'midjourney', 
    name: 'Midjourney', 
    icon: '🎨',
    description: 'Specialized for AI image generation and art',
    strengths: ['image generation', 'artistic styles', 'visual creativity']
  },
  { 
    id: 'claude', 
    name: 'Claude', 
    icon: '🧠',
    description: 'Excellent for reasoning, coding, and helpful assistance',
    strengths: ['reasoning', 'coding', 'analysis', 'safety']
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    icon: '💎',
    description: 'Multimodal AI for text, images, and complex reasoning',
    strengths: ['multimodal', 'reasoning', 'integration', 'real-time']
  },
  { 
    id: 'dalle', 
    name: 'DALL-E', 
    icon: '🖼️',
    description: 'OpenAI\'s image generation with precise control',
    strengths: ['image generation', 'precise control', 'photorealism']
  },
  { 
    id: 'stable-diffusion', 
    name: 'Stable Diffusion', 
    icon: '🌟',
    description: 'Open-source image generation with customization',
    strengths: ['customization', 'fine-tuning', 'artistic styles']
  }
]

const CATEGORIES = [
  { id: 'writing', name: 'Writing', icon: '✍️', description: 'Articles, stories, emails, content' },
  { id: 'design', name: 'Design', icon: '🎨', description: 'UI/UX, graphics, visual concepts' },
  { id: 'business', name: 'Business', icon: '💼', description: 'Strategy, marketing, presentations' },
  { id: 'coding', name: 'Coding', icon: '💻', description: 'Programming, debugging, architecture' },
  { id: 'marketing', name: 'Marketing', icon: '📈', description: 'Campaigns, copy, social media' },
  { id: 'academic', name: 'Academic', icon: '🎓', description: 'Research, analysis, education' },
  { id: 'creative', name: 'Creative', icon: '🎭', description: 'Art, music, storytelling' },
  { id: 'technical', name: 'Technical', icon: '⚙️', description: 'Documentation, tutorials, guides' }
]

const TONE_OPTIONS = [
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'casual', name: 'Casual', icon: '😊' },
  { id: 'persuasive', name: 'Persuasive', icon: '🎯' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'technical', name: 'Technical', icon: '⚙️' },
  { id: 'friendly', name: 'Friendly', icon: '🤝' }
]

const AUDIENCE_OPTIONS = [
  { id: 'general', name: 'General', icon: '👥' },
  { id: 'expert', name: 'Expert', icon: '🎓' },
  { id: 'beginner', name: 'Beginner', icon: '🌱' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'creative', name: 'Creative', icon: '🎭' },
  { id: 'technical', name: 'Technical', icon: '💻' }
]

export default function HomeScreen() {
  const [inputText, setInputText] = useState('')
  const [selectedModel, setSelectedModel] = useState('chatgpt')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [optimizedPrompt, setOptimizedPrompt] = useState('')
  const [promptVariations, setPromptVariations] = useState<any[]>([])
  const [qualityScore, setQualityScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [showVariations, setShowVariations] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [dailyUsage, setDailyUsage] = useState(0)
  const [selectedTone, setSelectedTone] = useState('')
  const [selectedAudience, setSelectedAudience] = useState('')
  
  // Animation values
  const pulseAnim = new Animated.Value(1)
  const fadeAnim = new Animated.Value(0)

  useEffect(() => {
    // Set up auth listener
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        // Simulate premium status - in real app would check subscription
        setIsPremium(Math.random() > 0.5) // 50% chance for demo
        setDailyUsage(Math.floor(Math.random() * 3)) // Random usage for demo
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isRecording])

  useEffect(() => {
    if (showResult) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else {
      fadeAnim.setValue(0)
    }
  }, [showResult])

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(recording)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
      Alert.alert('Error', 'Failed to start recording. Please try again.')
    }
  }

  const stopRecording = async () => {
    if (!recording) return

    setIsRecording(false)
    await recording.stopAndUnloadAsync()
    
    try {
      const uri = recording.getURI()
      if (uri) {
        // Convert audio to base64 for transcription
        const response = await fetch(uri)
        const blob = await response.blob()
        const reader = new FileReader()
        
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1]
          
          try {
            const { text } = await blink.ai.transcribeAudio({
              audio: base64,
              language: 'en'
            })
            setInputText(text)
          } catch (error) {
            console.error('Transcription error:', error)
            Alert.alert('Error', 'Failed to transcribe audio. Please try typing instead.')
          }
        }
        
        reader.readAsDataURL(blob)
      }
    } catch (error) {
      console.error('Error processing recording:', error)
      Alert.alert('Error', 'Failed to process recording. Please try again.')
    }
    
    setRecording(null)
  }

  const handleVoicePress = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const calculateQualityScore = (optimizedPrompt: string, originalInput: string) => {
    let score = 50 // Base score
    
    // Length and detail bonus
    if (optimizedPrompt.length > originalInput.length * 2) score += 15
    if (optimizedPrompt.length > originalInput.length * 3) score += 10
    
    // Structure indicators
    if (optimizedPrompt.includes('specific') || optimizedPrompt.includes('detailed')) score += 5
    if (optimizedPrompt.includes('format') || optimizedPrompt.includes('structure')) score += 5
    if (optimizedPrompt.includes('example') || optimizedPrompt.includes('instance')) score += 5
    if (optimizedPrompt.includes('context') || optimizedPrompt.includes('background')) score += 5
    if (optimizedPrompt.includes('tone') || optimizedPrompt.includes('style')) score += 5
    if (optimizedPrompt.includes('audience') || optimizedPrompt.includes('target')) score += 5
    
    // Complexity bonus
    const sentences = optimizedPrompt.split('.').length
    if (sentences > 3) score += 5
    if (sentences > 5) score += 5
    
    return Math.min(100, Math.max(0, score))
  }

  const generatePromptVariations = async (mainPrompt: string) => {
    try {
      const variations = []
      
      // Generate 3 variations with different approaches
      const variationPrompts = [
        `Create a more concise version of this prompt while maintaining its effectiveness: "${mainPrompt}"`,
        `Create a more detailed and comprehensive version of this prompt: "${mainPrompt}"`,
        `Create an alternative approach to this prompt with different phrasing but same goal: "${mainPrompt}"`
      ]

      for (let i = 0; i < variationPrompts.length; i++) {
        const { text } = await blink.ai.generateText({
          prompt: variationPrompts[i],
          model: 'gpt-4o-mini'
        })
        
        variations.push({
          id: i + 1,
          title: i === 0 ? 'Concise Version' : i === 1 ? 'Detailed Version' : 'Alternative Approach',
          prompt: text,
          score: calculateQualityScore(text, inputText)
        })
      }
      
      setPromptVariations(variations)
    } catch (error) {
      console.error('Error generating variations:', error)
    }
  }

  const optimizePrompt = async () => {
    if (!inputText.trim()) {
      Alert.alert('Input Required', 'Please enter some text or record your voice first.')
      return
    }

    // Check usage limits for free users
    if (!isPremium && dailyUsage >= 5) {
      Alert.alert(
        'Daily Limit Reached',
        'You\'ve reached your daily limit of 5 prompts. Upgrade to Premium for unlimited prompts!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            Alert.alert('Upgrade', 'Navigate to Premium tab to upgrade your account.')
          }}
        ]
      )
      return
    }

    setIsProcessing(true)
    setShowResult(false)
    
    try {
      const selectedModelData = AI_MODELS.find(m => m.id === selectedModel)
      const selectedCategoryData = CATEGORIES.find(c => c.id === selectedCategory)
      const selectedToneData = TONE_OPTIONS.find(t => t.id === selectedTone)
      const selectedAudienceData = AUDIENCE_OPTIONS.find(a => a.id === selectedAudience)

      const modelContext = `${selectedModelData?.name} - ${selectedModelData?.description}. Strengths: ${selectedModelData?.strengths.join(', ')}`
      const categoryContext = selectedCategoryData ? ` Focus specifically on ${selectedCategoryData.name.toLowerCase()} (${selectedCategoryData.description}) use cases and best practices.` : ''
      const toneContext = selectedToneData ? ` Use a ${selectedToneData.name.toLowerCase()} tone.` : ''
      const audienceContext = selectedAudienceData ? ` Target audience: ${selectedAudienceData.name.toLowerCase()} users.` : ''

      // Generate main optimized prompt
      const { text: mainPrompt } = await blink.ai.generateText({
        prompt: `You are an expert prompt engineer with deep knowledge of AI model capabilities and prompt optimization techniques.

Transform this rough user input into a perfectly structured, optimized prompt for ${modelContext}.${categoryContext}${toneContext}${audienceContext}

User input: "${inputText}"

Requirements:
- Make it clear, specific, and actionable
- Include relevant context and constraints
- Optimize for the target AI model's specific strengths and capabilities
- Maintain the user's original intent and goals
- Use professional prompt engineering best practices (specificity, examples, format instructions, etc.)
- Add helpful formatting, examples, or structure if beneficial
- Ensure the prompt will produce high-quality, relevant outputs
- Consider the model's token limits and processing style

Return only the optimized prompt, nothing else.`,
        model: 'gpt-4o-mini'
      })

      // Calculate quality score
      const qualityScore = calculateQualityScore(mainPrompt, inputText)
      
      setOptimizedPrompt(mainPrompt)
      setQualityScore(qualityScore)
      setShowResult(true)

      // Generate variations for premium users
      if (isPremium) {
        generatePromptVariations(mainPrompt)
      }

      // Update usage tracking
      setDailyUsage(prev => prev + 1)

    } catch (error) {
      console.error('Error optimizing prompt:', error)
      Alert.alert('Error', 'Failed to optimize prompt. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const copyToClipboard = async () => {
    await Clipboard.setString(optimizedPrompt)
    Alert.alert('Copied!', 'Optimized prompt copied to clipboard.')
  }

  const startOver = () => {
    setInputText('')
    setOptimizedPrompt('')
    setPromptVariations([])
    setQualityScore(0)
    setShowResult(false)
    setShowVariations(false)
    setSelectedCategory('')
    setSelectedTone('')
    setSelectedAudience('')
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>✨ Welcome to Prompt Pilot</Text>
        <Text style={styles.loadingSubtext}>Please sign in to continue</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => blink.auth.login()}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✨ Prompt Pilot</Text>
        <Text style={styles.headerSubtitle}>Transform ideas into perfect AI prompts</Text>
        <Text style={styles.welcomeText}>Welcome, {user?.email?.split('@')[0] || 'User'}!</Text>
        
        {/* Usage Indicator */}
        <View style={styles.usageIndicator}>
          {isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>👑 Premium - Unlimited</Text>
            </View>
          ) : (
            <View style={styles.usageBadge}>
              <Text style={styles.usageText}>
                {dailyUsage}/5 prompts today
              </Text>
              {dailyUsage >= 4 && (
                <Text style={styles.upgradeHint}>Upgrade for unlimited!</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {!showResult ? (
        <>
          {/* Voice Input */}
          <View style={styles.voiceSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.voiceButton,
                  isRecording && styles.voiceButtonRecording
                ]} 
                onPress={handleVoicePress}
              >
                <Text style={styles.voiceButtonIcon}>
                  {isRecording ? '⏹️' : '🎤'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Tap to stop recording' : 'Tap to speak your idea'}
            </Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Or type your idea</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., 'make a birthday message for my 8-year-old niece'"
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* AI Model Selection */}
          <View style={styles.modelSection}>
            <Text style={styles.sectionTitle}>Choose AI Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {AI_MODELS.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelChip,
                    selectedModel === model.id && styles.modelChipSelected
                  ]}
                  onPress={() => setSelectedModel(model.id)}
                >
                  <Text style={styles.modelIcon}>{model.icon}</Text>
                  <Text style={[
                    styles.modelName,
                    selectedModel === model.id && styles.modelNameSelected
                  ]}>
                    {model.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category Selection */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Category (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Tone Selection */}
          <View style={styles.toneSection}>
            <Text style={styles.sectionTitle}>Tone (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TONE_OPTIONS.map((tone) => (
                <TouchableOpacity
                  key={tone.id}
                  style={[
                    styles.toneChip,
                    selectedTone === tone.id && styles.toneChipSelected
                  ]}
                  onPress={() => setSelectedTone(selectedTone === tone.id ? '' : tone.id)}
                >
                  <Text style={styles.toneIcon}>{tone.icon}</Text>
                  <Text style={[
                    styles.toneName,
                    selectedTone === tone.id && styles.toneNameSelected
                  ]}>
                    {tone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Audience Selection */}
          <View style={styles.audienceSection}>
            <Text style={styles.sectionTitle}>Audience (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {AUDIENCE_OPTIONS.map((audience) => (
                <TouchableOpacity
                  key={audience.id}
                  style={[
                    styles.audienceChip,
                    selectedAudience === audience.id && styles.audienceChipSelected
                  ]}
                  onPress={() => setSelectedAudience(selectedAudience === audience.id ? '' : audience.id)}
                >
                  <Text style={styles.audienceIcon}>{audience.icon}</Text>
                  <Text style={[
                    styles.audienceName,
                    selectedAudience === audience.id && styles.audienceNameSelected
                  ]}>
                    {audience.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Optimize Button */}
          <TouchableOpacity
            style={[styles.optimizeButton, (!inputText.trim() || isProcessing) && styles.optimizeButtonDisabled]}
            onPress={optimizePrompt}
            disabled={!inputText.trim() || isProcessing}
          >
            <Text style={styles.optimizeButtonText}>
              {isProcessing ? '🧠 Optimizing...' : '⚡ Optimize Prompt'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        /* Results Screen */
        <Animated.View style={[styles.resultContainer, { opacity: fadeAnim }]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>🎉 Optimized Prompt</Text>
            <Text style={styles.resultSubtitle}>
              Optimized for {AI_MODELS.find(m => m.id === selectedModel)?.name}
              {selectedCategory && ` • ${CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
            </Text>
            
            {/* Quality Score */}
            <View style={styles.qualityScore}>
              <Text style={styles.qualityScoreLabel}>Quality Score</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreNumber}>{qualityScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreProgress, { width: `${qualityScore}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.promptCard}>
            <ScrollView style={styles.promptScrollView}>
              <Text style={styles.promptText}>{optimizedPrompt}</Text>
            </ScrollView>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
              <Text style={styles.copyButtonText}>📋 Copy Prompt</Text>
            </TouchableOpacity>
            
            {isPremium && promptVariations.length > 0 && (
              <TouchableOpacity 
                style={styles.variationsButton} 
                onPress={() => setShowVariations(!showVariations)}
              >
                <Text style={styles.variationsButtonText}>
                  {showVariations ? '🔼 Hide' : '🔽 Show'} Variations
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.startOverButton} onPress={startOver}>
              <Text style={styles.startOverButtonText}>🔄 Start Over</Text>
            </TouchableOpacity>
          </View>

          {/* Prompt Variations (Premium Feature) */}
          {isPremium && showVariations && promptVariations.length > 0 && (
            <View style={styles.variationsContainer}>
              <Text style={styles.variationsTitle}>✨ Premium Variations</Text>
              {promptVariations.map((variation) => (
                <View key={variation.id} style={styles.variationCard}>
                  <View style={styles.variationHeader}>
                    <Text style={styles.variationTitle}>{variation.title}</Text>
                    <View style={styles.variationScore}>
                      <Text style={styles.variationScoreText}>{variation.score}/100</Text>
                    </View>
                  </View>
                  <ScrollView style={styles.variationScrollView}>
                    <Text style={styles.variationText}>{variation.prompt}</Text>
                  </ScrollView>
                  <TouchableOpacity 
                    style={styles.useVariationButton}
                    onPress={() => {
                      setOptimizedPrompt(variation.prompt)
                      setQualityScore(variation.score)
                      setShowVariations(false)
                    }}
                  >
                    <Text style={styles.useVariationButtonText}>Use This Version</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.originalInput}>
            <Text style={styles.originalInputLabel}>Original input:</Text>
            <Text style={styles.originalInputText}>"{inputText}"</Text>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  usageIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  premiumBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  usageBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  usageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  upgradeHint: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginTop: 2,
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  voiceButtonIcon: {
    fontSize: 32,
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modelSection: {
    marginBottom: 32,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modelChipSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  modelIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  modelName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  modelNameSelected: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryNameSelected: {
    color: '#FFFFFF',
  },
  toneSection: {
    marginBottom: 32,
  },
  toneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toneChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  toneIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toneName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  toneNameSelected: {
    color: '#FFFFFF',
  },
  audienceSection: {
    marginBottom: 40,
  },
  audienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  audienceChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  audienceIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  audienceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  audienceNameSelected: {
    color: '#FFFFFF',
  },
  optimizeButton: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  optimizeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  optimizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  qualityScore: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qualityScoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
  },
  scoreMax: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 2,
  },
  scoreBar: {
    width: 120,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 300,
  },
  promptScrollView: {
    flex: 1,
  },
  promptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startOverButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  startOverButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  variationsButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  variationsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  variationsContainer: {
    marginBottom: 24,
  },
  variationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  variationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  variationScore: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  variationScoreText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  variationScrollView: {
    maxHeight: 120,
    marginBottom: 12,
  },
  variationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  useVariationButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  useVariationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  originalInput: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  originalInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  originalInputText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
})
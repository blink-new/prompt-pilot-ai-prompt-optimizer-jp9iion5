import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { blink } from '@/lib/blink';

const PREMIUM_FEATURES = [
  {
    icon: '🚀',
    title: 'Unlimited Prompts',
    description: 'Create unlimited optimized prompts without daily limits',
    free: '5 per day',
    premium: 'Unlimited'
  },
  {
    icon: '🤖',
    title: 'Advanced AI Models',
    description: 'Access to GPT-4, Claude-3 Opus, and latest AI models',
    free: 'Basic models',
    premium: 'All models'
  },
  {
    icon: '🎨',
    title: 'Custom Templates',
    description: 'Create and save your own prompt templates',
    free: 'Standard templates',
    premium: 'Custom templates'
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Track prompt performance and optimization metrics',
    free: 'Basic stats',
    premium: 'Full analytics'
  },
  {
    icon: '🔄',
    title: 'Batch Processing',
    description: 'Optimize multiple prompts at once',
    free: 'One at a time',
    premium: 'Batch processing'
  },
  {
    icon: '🎯',
    title: 'A/B Testing',
    description: 'Test different prompt variations for best results',
    free: 'Single version',
    premium: 'A/B testing'
  },
  {
    icon: '🌐',
    title: 'API Access',
    description: 'Integrate Prompt Pilot into your own applications',
    free: 'No API',
    premium: 'Full API access'
  },
  {
    icon: '👥',
    title: 'Team Collaboration',
    description: 'Share prompts and collaborate with team members',
    free: 'Personal use',
    premium: 'Team features'
  }
];

const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: '$9.99',
    period: '/month',
    description: 'Perfect for individuals',
    popular: false,
    features: [
      'Unlimited prompts',
      'Advanced AI models',
      'Custom templates',
      'Analytics dashboard',
      'Priority support'
    ]
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: '$79.99',
    period: '/year',
    description: 'Save 33% with annual billing',
    popular: true,
    savings: 'Save $40/year',
    features: [
      'Everything in Monthly',
      'Batch processing',
      'A/B testing',
      'API access',
      'Team collaboration (up to 5 users)'
    ]
  },
  {
    id: 'team',
    name: 'Team Plan',
    price: '$29.99',
    period: '/month',
    description: 'For teams and businesses',
    popular: false,
    features: [
      'Everything in Premium',
      'Unlimited team members',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support'
    ]
  }
];

export default function PremiumScreen() {
  const [user, setUser] = useState(null);
  const [userUsage, setUserUsage] = useState({ promptsToday: 0, totalPrompts: 0 });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user) {
        loadUserUsage();
        checkPremiumStatus();
      }
    });
    return unsubscribe;
  }, []);

  const loadUserUsage = async () => {
    try {
      // Get today's prompts
      const today = new Date().toISOString().split('T')[0];
      const todayPrompts = await blink.db.prompts.list({
        where: { 
          userId: user?.id || '',
          createdAt: { gte: today }
        }
      });

      // Get total prompts
      const totalPrompts = await blink.db.prompts.list({
        where: { userId: user?.id || '' }
      });

      setUserUsage({
        promptsToday: todayPrompts.length,
        totalPrompts: totalPrompts.length
      });
    } catch (error) {
      console.error('Error loading usage:', error);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      // Check if user has premium subscription
      const subscriptions = await blink.db.subscriptions.list({
        where: { 
          userId: user?.id || '',
          status: 'active'
        }
      });
      setIsPremium(subscriptions.length > 0);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      // In a real implementation, this would integrate with Stripe
      Alert.alert(
        'Upgrade to Premium',
        `You selected the ${PRICING_PLANS.find(p => p.id === planId)?.name} plan. This would normally redirect to Stripe checkout.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              // Simulate successful subscription
              simulateSubscription(planId);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error upgrading:', error);
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
    }
  };

  const simulateSubscription = async (planId) => {
    try {
      // Create subscription record
      await blink.db.subscriptions.create({
        userId: user.id,
        planId: planId,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: planId === 'yearly' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      });

      setIsPremium(true);
      setShowUpgradeModal(false);
      Alert.alert('Welcome to Premium!', 'Your subscription is now active. Enjoy unlimited prompts and advanced features!');
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@promptpilot.ai?subject=Premium Support');
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view premium features</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isPremium ? '👑 Premium Active' : '💎 Upgrade to Premium'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isPremium 
            ? 'Enjoy unlimited prompts and advanced features'
            : 'Unlock the full power of AI prompt optimization'
          }
        </Text>
      </View>

      {/* Usage Stats */}
      <View style={styles.usageCard}>
        <Text style={styles.usageTitle}>📊 Your Usage</Text>
        <View style={styles.usageStats}>
          <View style={styles.usageStat}>
            <Text style={styles.usageNumber}>{userUsage.promptsToday}</Text>
            <Text style={styles.usageLabel}>
              {isPremium ? 'Prompts Today' : `Prompts Today (${5 - userUsage.promptsToday} left)`}
            </Text>
          </View>
          <View style={styles.usageStat}>
            <Text style={styles.usageNumber}>{userUsage.totalPrompts}</Text>
            <Text style={styles.usageLabel}>Total Prompts</Text>
          </View>
        </View>
        
        {!isPremium && userUsage.promptsToday >= 5 && (
          <View style={styles.limitWarning}>
            <Text style={styles.limitWarningText}>
              ⚠️ Daily limit reached. Upgrade to Premium for unlimited prompts!
            </Text>
          </View>
        )}
      </View>

      {/* Premium Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>✨ Premium Features</Text>
        {PREMIUM_FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
            <View style={styles.featureComparison}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Free:</Text>
                <Text style={styles.comparisonValue}>{feature.free}</Text>
              </View>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Premium:</Text>
                <Text style={[styles.comparisonValue, styles.premiumValue]}>{feature.premium}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Pricing Plans */}
      {!isPremium && (
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>💰 Choose Your Plan</Text>
          {PRICING_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.pricingCard,
                plan.popular && styles.popularPlan,
                selectedPlan === plan.id && styles.selectedPlan
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
              </View>
              
              {plan.savings && (
                <Text style={styles.planSavings}>{plan.savings}</Text>
              )}
              
              <Text style={styles.planDescription}>{plan.description}</Text>
              
              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <Text key={index} style={styles.planFeature}>✓ {feature}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowUpgradeModal(true)}
          >
            <Text style={styles.upgradeButtonText}>🚀 Upgrade Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Premium Benefits */}
      {isPremium && (
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>🎉 Your Premium Benefits</Text>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>✅ Premium Active</Text>
            <Text style={styles.benefitDescription}>
              You have access to all premium features including unlimited prompts, 
              advanced AI models, and priority support.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.supportButton} onPress={openSupport}>
            <Text style={styles.supportButtonText}>📧 Contact Premium Support</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚀 Upgrade to Premium</Text>
            <Text style={styles.modalSubtitle}>
              You selected: {PRICING_PLANS.find(p => p.id === selectedPlan)?.name}
            </Text>
            
            <View style={styles.modalPricing}>
              <Text style={styles.modalPrice}>
                {PRICING_PLANS.find(p => p.id === selectedPlan)?.price}
                <Text style={styles.modalPeriod}>
                  {PRICING_PLANS.find(p => p.id === selectedPlan)?.period}
                </Text>
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleUpgrade(selectedPlan)}
              >
                <Text style={styles.confirmButtonText}>Confirm Upgrade</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  usageCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageStat: {
    alignItems: 'center',
  },
  usageNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  usageLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  limitWarning: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  limitWarningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  featureComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 14,
    color: '#374151',
  },
  premiumValue: {
    color: '#6366F1',
    fontWeight: '600',
  },
  pricingSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#6366F1',
  },
  selectedPlan: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  planSavings: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  planFeatures: {
    marginTop: 8,
  },
  planFeature: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  benefitCard: {
    backgroundColor: '#ECFDF5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supportButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPricing: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  modalPeriod: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalButtons: {
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
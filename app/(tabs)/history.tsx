import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { blink } from '@/lib/blink';

const AI_MODELS = {
  chatgpt: { name: 'ChatGPT', icon: '🤖' },
  midjourney: { name: 'Midjourney', icon: '🎨' },
  claude: { name: 'Claude', icon: '🧠' },
  gemini: { name: 'Gemini', icon: '💎' }
};

export default function HistoryScreen() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      if (state.user) {
        loadPrompts();
      }
    });
    return unsubscribe;
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const userPrompts = await blink.db.prompts.list({
        where: { userId: user?.id || '' },
        orderBy: { createdAt: 'desc' },
        limit: 100
      });
      setPrompts(userPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
      Alert.alert('Error', 'Failed to load prompt history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.originalInput?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.optimizedPrompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyPrompt = async (prompt) => {
    await Clipboard.setString(prompt.optimizedPrompt);
    Alert.alert('Copied!', 'Prompt copied to clipboard');
  };

  const sharePrompt = async (prompt) => {
    try {
      await Share.share({
        message: `✨ Optimized with Prompt Pilot\n\n${prompt.optimizedPrompt}\n\n---\nOriginal: "${prompt.originalInput}"\nModel: ${AI_MODELS[prompt.targetModel]?.name || prompt.targetModel}${prompt.category ? `\nCategory: ${prompt.category}` : ''}`,
        title: 'AI Prompt from Prompt Pilot'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const exportToApp = (prompt, appType) => {
    const optimizedPrompt = prompt.optimizedPrompt;
    
    switch (appType) {
      case 'chatgpt':
        Linking.openURL(`https://chat.openai.com/?q=${encodeURIComponent(optimizedPrompt)}`);
        break;
      case 'claude':
        Linking.openURL(`https://claude.ai/chat`);
        copyPrompt(prompt);
        Alert.alert('Exported!', 'Prompt copied to clipboard. Paste it in Claude.');
        break;
      case 'gemini':
        Linking.openURL(`https://gemini.google.com/app`);
        copyPrompt(prompt);
        Alert.alert('Exported!', 'Prompt copied to clipboard. Paste it in Gemini.');
        break;
      case 'midjourney':
        copyPrompt(prompt);
        Alert.alert('Exported!', 'Prompt copied to clipboard. Paste it in Midjourney Discord.');
        break;
      default:
        copyPrompt(prompt);
    }
    setShowExportModal(false);
  };

  const deletePrompt = async (promptId) => {
    Alert.alert(
      'Delete Prompt',
      'Are you sure you want to delete this prompt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await blink.db.prompts.delete(promptId);
              setPrompts(prompts.filter(p => p.id !== promptId));
            } catch (error) {
              console.error('Error deleting prompt:', error);
              Alert.alert('Error', 'Failed to delete prompt');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please sign in to view history</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Prompt History</Text>
        <Text style={styles.headerSubtitle}>Your optimized prompts</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search prompts..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Prompts List */}
      <ScrollView style={styles.promptsList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading prompts...</Text>
          </View>
        ) : filteredPrompts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No prompts yet</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No prompts match your search' : 'Create your first optimized prompt!'}
            </Text>
          </View>
        ) : (
          filteredPrompts.map((prompt) => (
            <View key={prompt.id} style={styles.promptCard}>
              {/* Card Header */}
              <View style={styles.promptHeader}>
                <View style={styles.promptMeta}>
                  <View style={styles.modelBadge}>
                    <Text style={styles.modelIcon}>
                      {AI_MODELS[prompt.targetModel]?.icon || '🤖'}
                    </Text>
                    <Text style={styles.modelName}>
                      {AI_MODELS[prompt.targetModel]?.name || prompt.targetModel}
                    </Text>
                  </View>
                  {prompt.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{prompt.category}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.promptDate}>{formatDate(prompt.createdAt)}</Text>
              </View>

              {/* Original Input */}
              <View style={styles.originalSection}>
                <Text style={styles.originalLabel}>Original:</Text>
                <Text style={styles.originalText} numberOfLines={2}>
                  "{prompt.originalInput}"
                </Text>
              </View>

              {/* Optimized Prompt */}
              <View style={styles.optimizedSection}>
                <Text style={styles.optimizedLabel}>Optimized:</Text>
                <Text style={styles.optimizedText} numberOfLines={3}>
                  {prompt.optimizedPrompt}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => copyPrompt(prompt)}
                >
                  <Text style={styles.actionButtonText}>📋 Copy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => sharePrompt(prompt)}
                >
                  <Text style={styles.actionButtonText}>📤 Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedPrompt(prompt);
                    setShowExportModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>🚀 Export</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => deletePrompt(prompt.id)}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚀 Export to App</Text>
            <Text style={styles.modalSubtitle}>Choose where to use your prompt</Text>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => exportToApp(selectedPrompt, 'chatgpt')}
              >
                <Text style={styles.exportIcon}>🤖</Text>
                <Text style={styles.exportName}>ChatGPT</Text>
                <Text style={styles.exportDescription}>Open in ChatGPT</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => exportToApp(selectedPrompt, 'claude')}
              >
                <Text style={styles.exportIcon}>🧠</Text>
                <Text style={styles.exportName}>Claude</Text>
                <Text style={styles.exportDescription}>Copy & open Claude</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => exportToApp(selectedPrompt, 'gemini')}
              >
                <Text style={styles.exportIcon}>💎</Text>
                <Text style={styles.exportName}>Gemini</Text>
                <Text style={styles.exportDescription}>Copy & open Gemini</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportOption}
                onPress={() => exportToApp(selectedPrompt, 'midjourney')}
              >
                <Text style={styles.exportIcon}>🎨</Text>
                <Text style={styles.exportName}>Midjourney</Text>
                <Text style={styles.exportDescription}>Copy for Discord</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promptsList: {
    flex: 1,
    paddingHorizontal: 20,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  promptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  modelIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  modelName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  categoryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  promptDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  originalSection: {
    marginBottom: 12,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  optimizedSection: {
    marginBottom: 16,
  },
  optimizedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  optimizedText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  exportOptions: {
    marginBottom: 24,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  exportIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  exportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  exportDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalCloseButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
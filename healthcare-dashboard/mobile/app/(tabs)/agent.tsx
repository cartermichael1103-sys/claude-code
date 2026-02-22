import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { askAgent, fetchSuggestions } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  timestamp: number;
  isStreaming?: boolean;
}

interface SuggestionCategory {
  category: string;
  icon: string;
  questions: string[];
}

const TOOL_LABELS: Record<string, string> = {
  get_census_analysis: "Census Analysis",
  get_revenue_analysis: "Revenue Analysis",
  get_labor_analysis: "Labor Analysis",
  get_ar_analysis: "AR Analysis",
  get_benchmarks: "Benchmarks",
  get_dashboard_overview: "Dashboard Overview",
};

const markdownStyles = {
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  heading1: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginVertical: 8 },
  heading2: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginVertical: 6 },
  heading3: { color: colors.primary, fontSize: 14, fontWeight: "700", marginVertical: 4 },
  strong: { color: colors.textPrimary, fontWeight: "700" },
  em: { color: colors.textSecondary, fontStyle: "italic" },
  bullet_list: { marginVertical: 4 },
  list_item: { color: colors.textSecondary },
  code_inline: { backgroundColor: colors.bgInput, color: colors.primary, borderRadius: 4, paddingHorizontal: 4, fontSize: 13 },
  fence: { backgroundColor: colors.bgInput, borderRadius: 8, padding: 12, marginVertical: 8 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12, marginLeft: 0 },
  hr: { backgroundColor: colors.border },
  table: { borderWidth: 1, borderColor: colors.border },
  th: { backgroundColor: colors.bgCardAlt, color: colors.textSecondary, fontWeight: "700" },
  td: { color: colors.textSecondary },
};

export default function AgentScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionCategory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  const inputRef = useRef<TextInput>(null);

  // Animated pulse for AI thinking indicator
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [loading]);

  // Load suggestions
  useEffect(() => {
    fetchSuggestions()
      .then(setSuggestions)
      .catch(() => {});
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setShowSuggestions(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const result = await askAgent(trimmed, conversationHistory);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        toolsUsed: result.toolsUsed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setConversationHistory(result.conversationHistory);

      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ **Connection Error**\n\nUnable to reach the AI backend. Please ensure the backend server is running on port 3001.\n\n\`${err.message || "Network error"}\``,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [loading, conversationHistory]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationHistory([]);
    setShowSuggestions(true);
    setInput("");
  }, []);

  const currentSuggestions = suggestions[selectedCategory];

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={["#0D0820", "#150D35"]} style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={["#4E3EA8", "#7B61FF"]} style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={22} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>SNF Advisor Pro</Text>
            <Text style={styles.headerSubtitle}>Powered by Claude Opus</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={clearConversation} style={styles.clearBtn}>
            <Ionicons name="refresh" size={16} color={colors.textMuted} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <LinearGradient colors={["#1A0A40", "#2D1580"]} style={styles.welcomeCard}>
                <View style={styles.welcomeIconWrap}>
                  <Animated.View style={{ opacity: loading ? pulseAnim : 1 }}>
                    <LinearGradient colors={["#4E3EA8", "#7B61FF"]} style={styles.welcomeIcon}>
                      <Ionicons name="sparkles" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                </View>
                <Text style={styles.welcomeTitle}>SNF Advisor Pro</Text>
                <Text style={styles.welcomeDesc}>
                  I have deep expertise in all aspects of Skilled Nursing Facility operations — Census, Revenue Cycle (PDPM), Labor/Staffing, and AR & Collections. I've already reviewed your facility data.
                </Text>
                <View style={styles.welcomeFeatures}>
                  {[
                    { icon: "analytics", text: "Real-time KPI Analysis" },
                    { icon: "bulb", text: "Benchmark Comparisons" },
                    { icon: "list", text: "Actionable Recommendations" },
                    { icon: "cash", text: "Financial Impact Quantified" },
                  ].map((f) => (
                    <View key={f.text} style={styles.welcomeFeature}>
                      <Ionicons name={f.icon as any} size={14} color={colors.secondary} />
                      <Text style={styles.welcomeFeatureText}>{f.text}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>

              {/* Suggestion Categories */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {/* Category Tabs */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryTabs}
                  >
                    {suggestions.map((cat, i) => (
                      <TouchableOpacity
                        key={cat.category}
                        style={[styles.categoryTab, i === selectedCategory && styles.categoryTabActive]}
                        onPress={() => setSelectedCategory(i)}
                      >
                        <Text style={[styles.categoryTabText, i === selectedCategory && styles.categoryTabTextActive]}>
                          {cat.category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Questions */}
                  {currentSuggestions?.questions.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.suggestionChip}
                      onPress={() => sendMessage(q)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chatbubble-ellipses" size={14} color={colors.secondary} style={{ marginTop: 1 }} />
                      <Text style={styles.suggestionText}>{q}</Text>
                      <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Message Bubbles */}
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              {msg.role === "assistant" && (
                <View style={styles.assistantHeader}>
                  <LinearGradient colors={["#4E3EA8", "#7B61FF"]} style={styles.assistantAvatar}>
                    <Ionicons name="sparkles" size={12} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.assistantName}>SNF Advisor Pro</Text>
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <View style={styles.toolsUsed}>
                      <Ionicons name="build" size={10} color={colors.textMuted} />
                      <Text style={styles.toolsUsedText}>
                        {msg.toolsUsed.map((t) => TOOL_LABELS[t] || t).join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {msg.role === "user" ? (
                <LinearGradient colors={["#0D1E3D", "#162040"]} style={styles.userBubbleInner}>
                  <Text style={styles.userText}>{msg.content}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.assistantBubbleInner}>
                  <Markdown style={markdownStyles as any}>{msg.content}</Markdown>
                </View>
              )}
              <Text style={[styles.timestamp, msg.role === "user" && styles.timestampUser]}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ))}

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingBubble}>
              <LinearGradient colors={["#4E3EA8", "#7B61FF"]} style={styles.assistantAvatar}>
                <Animated.View style={{ opacity: pulseAnim }}>
                  <Ionicons name="sparkles" size={12} color="#FFF" />
                </Animated.View>
              </LinearGradient>
              <View style={styles.loadingDots}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.loadingText}>Analyzing your facility data...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <LinearGradient colors={["#0A1020", "#0D1530"]} style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about Census, Revenue, Labor, or AR..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            >
              <LinearGradient
                colors={input.trim() && !loading ? ["#4E3EA8", "#7B61FF"] : [colors.border, colors.border]}
                style={styles.sendBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Ionicons name="send" size={16} color={input.trim() ? "#FFF" : colors.textDisabled} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.secondary}30`,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  headerSubtitle: { fontSize: 11, color: colors.secondary, fontWeight: "600" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg },
  welcomeContainer: { gap: spacing.md },
  welcomeCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
    alignItems: "center",
  },
  welcomeIconWrap: { marginBottom: spacing.md },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: { fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginBottom: spacing.sm },
  welcomeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  welcomeFeatures: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  welcomeFeature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.secondary}25`,
  },
  welcomeFeatureText: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  suggestionsContainer: { gap: spacing.sm },
  categoryTabs: { gap: spacing.xs, paddingHorizontal: 2, paddingBottom: spacing.xs },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabActive: { backgroundColor: `${colors.secondary}20`, borderColor: colors.secondary },
  categoryTabText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  categoryTabTextActive: { color: colors.secondary },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  messageBubble: { gap: spacing.xs },
  userBubble: { alignItems: "flex-end" },
  assistantBubble: { alignItems: "flex-start" },
  userBubbleInner: {
    maxWidth: width * 0.82,
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  assistantHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 4 },
  assistantAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  assistantName: { fontSize: 11, fontWeight: "700", color: colors.secondary },
  toolsUsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: `${colors.secondary}10`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.secondary}20`,
  },
  toolsUsedText: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
  assistantBubbleInner: {
    maxWidth: width * 0.92,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timestamp: { fontSize: 10, color: colors.textDisabled, paddingHorizontal: 4 },
  timestampUser: { textAlign: "right" },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === "ios" ? 0 : spacing.sm,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: { alignSelf: "flex-end" },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
